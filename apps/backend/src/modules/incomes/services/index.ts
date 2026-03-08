import { S3Client } from "@aws-sdk/client-s3";

import { AttachmentRepository } from "@/modules/shared/repositories";

import { dbRepository } from "../repositories";
import { IncomeServiceImpl } from "./IncomeServiceImpl";

const attachmentRepository = new AttachmentRepository({
  s3Client: new S3Client({}),
  bucketName: process.env.INCOMES_ATTACHMENTS_BUCKET_NAME!,
});

export const incomeService = new IncomeServiceImpl({
  dbRepository,
  attachmentRepository,
});
