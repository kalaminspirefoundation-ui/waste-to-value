import { DriveLedgerRecord, DriveVaultFile, UserRole } from '../types/punarchakra';

const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const VAULT_FOLDER_NAME = 'Punarchakra Admin Audit Vault';

export function assertAdminDriveAccess(role?: UserRole | null) {
  if (role !== 'admin') {
    throw new Error('Access denied: Only Administrator accounts can view, edit, or delete Google Drive vault records.');
  }
}

async function parseDriveError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error?.message || `Google Drive request failed (${res.status})`;
  } catch {
    return `Google Drive request failed (${res.status})`;
  }
}

export async function ensurePunarchakraVaultFolder(
  accessToken: string,
  role?: UserRole | null
): Promise<string> {
  assertAdminDriveAccess(role);
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='punarchakraVault' and value='true' }`
  );
  const searchRes = await fetch(`${DRIVE_FILES_API}?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!searchRes.ok) {
    throw new Error(await parseDriveError(searchRes));
  }
  const searchJson = await searchRes.json();
  if (Array.isArray(searchJson.files) && searchJson.files.length > 0) {
    return searchJson.files[0].id as string;
  }

  const createRes = await fetch(DRIVE_FILES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: VAULT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Admin-only audit and lifecycle ledger storage for Punarchakra Bengaluru (Logins, Pickups, Scrap Sold, Payments).',
      appProperties: {
        punarchakraVault: 'true',
        restrictedTo: 'admin',
      },
    }),
  });
  if (!createRes.ok) {
    throw new Error(await parseDriveError(createRes));
  }
  const folder = await createRes.json();
  return folder.id as string;
}

export async function listDriveVaultFiles(
  accessToken: string,
  folderId: string,
  role?: UserRole | null
): Promise<DriveVaultFile[]> {
  assertAdminDriveAccess(role);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size,webViewLink,appProperties)');
  const res = await fetch(`${DRIVE_FILES_API}?q=${q}&orderBy=modifiedTime%20desc&fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  const data = await res.json();
  const rawFiles = Array.isArray(data.files) ? data.files : [];
  return rawFiles.map((f: Record<string, unknown>) => ({
    id: String(f.id || ''),
    name: String(f.name || 'Untitled'),
    mimeType: String(f.mimeType || 'application/json'),
    modifiedTime: f.modifiedTime ? String(f.modifiedTime) : undefined,
    size: f.size ? String(f.size) : undefined,
    webViewLink: f.webViewLink ? String(f.webViewLink) : undefined,
    kindLabel:
      String(f.name || '').endsWith('.csv')
        ? 'Spreadsheet / CSV'
        : String(f.name || '').endsWith('.json')
        ? 'Structured JSON'
        : 'Vault Document',
  }));
}

export async function upsertDriveVaultFile(params: {
  accessToken: string;
  folderId: string;
  fileName: string;
  mimeType: string;
  content: string;
  existingFileId?: string;
  role?: UserRole | null;
  categoryTag?: string;
}): Promise<DriveVaultFile> {
  assertAdminDriveAccess(params.role);
  const boundary = `pnc_drive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const metadata: Record<string, unknown> = {
    name: params.fileName,
    mimeType: params.mimeType,
    appProperties: {
      punarchakraManaged: 'true',
      restrictedTo: 'admin',
      categoryTag: params.categoryTag || 'ledger',
    },
  };
  if (!params.existingFileId) {
    metadata.parents = [params.folderId];
  }

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${params.mimeType}; charset=UTF-8`,
    '',
    params.content,
    `--${boundary}--`,
  ].join('\r\n');

  const url = params.existingFileId
    ? `${DRIVE_UPLOAD_API}/${encodeURIComponent(params.existingFileId)}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`
    : `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`;

  const res = await fetch(url, {
    method: params.existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  const f = await res.json();
  return {
    id: String(f.id || ''),
    name: String(f.name || params.fileName),
    mimeType: String(f.mimeType || params.mimeType),
    modifiedTime: f.modifiedTime ? String(f.modifiedTime) : new Date().toISOString(),
    size: f.size ? String(f.size) : String(params.content.length),
    webViewLink: f.webViewLink ? String(f.webViewLink) : undefined,
    kindLabel: params.fileName.endsWith('.csv') ? 'Spreadsheet / CSV' : 'Structured JSON',
  };
}

export async function readDriveVaultFileContent(
  accessToken: string,
  fileId: string,
  role?: UserRole | null
): Promise<string> {
  assertAdminDriveAccess(role);
  const res = await fetch(`${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  return await res.text();
}

export async function deleteDriveVaultFile(
  accessToken: string,
  fileId: string,
  role?: UserRole | null
): Promise<void> {
  assertAdminDriveAccess(role);
  const res = await fetch(`${DRIVE_FILES_API}/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseDriveError(res));
  }
}

function escapeCsvCell(val: unknown): string {
  const s = val === undefined || val === null ? '' : String(val);
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildMasterLedgerJson(records: DriveLedgerRecord[]): string {
  return JSON.stringify(
    {
      platform: 'PUNARCHAKRA Bengaluru',
      generatedAt: new Date().toISOString(),
      accessPolicy: 'ADMIN_ONLY_VIEW_EDIT_DELETE',
      totalCapturedEvents: records.length,
      summary: {
        loginsCaptured: records.filter((r) => r.eventType === 'USER_LOGIN').length,
        bookingsCaptured: records.filter((r) => r.eventType === 'BOOKING_CREATED').length,
        scrapSoldEvents: records.filter((r) => r.eventType === 'SCRAP_SOLD').length,
        paymentEvents: records.filter((r) => r.eventType === 'PAYMENT_COMPLETED' || r.eventType === 'PAYMENT_UPDATED').length,
        totalVerifiedWeightKg: Number(
          records
            .filter((r) => r.eventType === 'SCRAP_SOLD')
            .reduce((s, r) => s + (r.weightKg || 0), 0)
            .toFixed(2)
        ),
        totalPayoutValueInr: Math.round(
          records
            .filter((r) => r.eventType === 'PAYMENT_COMPLETED')
            .reduce((s, r) => s + (r.amountInr || 0), 0)
        ),
      },
      records,
    },
    null,
    2
  );
}

export function buildScrapSalesAndPaymentsCsv(records: DriveLedgerRecord[]): string {
  const header =
    'Sequence,Timestamp,EventType,ReferenceCode,ActorName,ActorRole,EntityType,EntityID,City,PINCode,WeightKg,AmountINR,Summary,DetailsJSON\n';
  const filtered = records.filter((r) =>
    [
      'BOOKING_CREATED',
      'EXECUTIVE_ASSIGNED',
      'PICKUP_STATUS',
      'SCRAP_WEIGHED',
      'SCRAP_SOLD',
      'PAYMENT_COMPLETED',
      'PAYMENT_UPDATED',
      'QUOTATION_ACTIVITY',
      'ORDER_CANCELLED',
    ].includes(r.eventType)
  );
  const rows = filtered
    .map((r) =>
      [
        r.sequenceNo,
        r.timestamp,
        r.eventType,
        r.referenceCode || '',
        r.actorName,
        r.actorRole,
        r.entityType,
        r.entityId,
        r.city || 'Bengaluru',
        r.pinCode || '',
        r.weightKg ?? '',
        r.amountInr ?? '',
        r.summary,
        JSON.stringify(r.payload),
      ]
        .map(escapeCsvCell)
        .join(',')
    )
    .join('\n');
  return header + rows;
}

export function buildLoginAuditCsv(records: DriveLedgerRecord[]): string {
  const header =
    'Sequence,Timestamp,EventType,ActorUserID,ActorName,ActorRole,ActorEmail,Summary,MethodAndDeviceJSON\n';
  const filtered = records.filter((r) =>
    ['USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'PASSWORD_RESET', 'ADMIN_USER_MUTATION'].includes(
      r.eventType
    )
  );
  const rows = filtered
    .map((r) =>
      [
        r.sequenceNo,
        r.timestamp,
        r.eventType,
        r.actorUserId,
        r.actorName,
        r.actorRole,
        r.actorEmail || '',
        r.summary,
        JSON.stringify(r.payload),
      ]
        .map(escapeCsvCell)
        .join(',')
    )
    .join('\n');
  return header + rows;
}
