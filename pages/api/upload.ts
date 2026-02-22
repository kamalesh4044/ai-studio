import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

type UploadRequest = {
  fileName?: string;
  contentType?: string;
  size?: number;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as UploadRequest;
  return res.status(200).json({
    id: uuidv4(),
    fileName: body.fileName ?? "unknown",
    contentType: body.contentType ?? "application/octet-stream",
    size: body.size ?? 0,
    status: "stored-locally-mock"
  });
}
