import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const PRESIGNED_URL_EXPIRES_IN = 300; // 5 minutes

export interface AttachmentUrls {
  uploadUrl: string;
  viewUrl: string;
  key: string;
}

interface AttachmentRepositoryProps {
  s3Client: S3Client;
  bucketName: string;
}

function sanitizeFilename(name: string): string {
  // Strip extension — we re-append the validated one from contentType
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > 0 ? name.substring(0, dotIndex) : name;
  return (
    base
      .replace(/[^\w\s.-]/g, "") // keep word chars, spaces, dots, dashes
      .replace(/\s+/g, "_") // spaces → underscore
      .replace(/_+/g, "_") // collapse consecutive underscores
      .replace(/^[._]+|[._]+$/g, "") // strip leading/trailing dots and underscores
      .substring(0, 200) || "attachment" // max length + fallback
  );
}

export class AttachmentRepository {
  constructor(private readonly props: AttachmentRepositoryProps) {}

  async generateUrls(
    userId: string,
    recordId: string,
    contentType: string,
    filename: string,
  ): Promise<AttachmentUrls> {
    const ext = ALLOWED_CONTENT_TYPES[contentType];
    if (!ext) {
      throw new Error(
        `Unsupported content type: ${contentType}. Allowed: ${Object.keys(ALLOWED_CONTENT_TYPES).join(", ")}`,
      );
    }

    const safeName = sanitizeFilename(filename);
    const key = `${userId}/${recordId}/${safeName}.${ext}`;

    const uploadUrl = await getSignedUrl(
      this.props.s3Client,
      new PutObjectCommand({
        Bucket: this.props.bucketName,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: PRESIGNED_URL_EXPIRES_IN },
    );

    const viewUrl = await getSignedUrl(
      this.props.s3Client,
      new GetObjectCommand({
        Bucket: this.props.bucketName,
        Key: key,
      }),
      { expiresIn: PRESIGNED_URL_EXPIRES_IN },
    );

    return { uploadUrl, viewUrl, key };
  }
}
