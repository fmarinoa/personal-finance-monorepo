import { S3Client } from "@aws-sdk/client-s3";

import { dbRepository } from "@/modules/expenses/repositories";
import { AttachmentRepository } from "@/modules/shared/repositories";

import { ExpenseServiceImp } from "./ExpenseServiceImp";

const attachmentRepository = new AttachmentRepository({
  s3Client: new S3Client({}),
  bucketName: process.env.EXPENSES_ATTACHMENTS_BUCKET_NAME!,
});

export const expenseService = new ExpenseServiceImp({
  dbRepository,
  attachmentRepository,
});
