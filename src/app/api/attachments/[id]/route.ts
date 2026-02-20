import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // NEXT.JS 15: params agora é promise
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

  const resolvedParams = await params;

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: resolvedParams.id },
      include: { transaction: true }
    });

    if (!attachment || attachment.transaction?.userId !== session.user.id) {
      return new NextResponse("Anexo não encontrado", { status: 404 });
    }

    // Retorna os Bytes com o Header correto para o navegador saber que é imagem/pdf
    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      },
    });
  } catch (error) {
    return new NextResponse("Erro ao buscar anexo", { status: 500 });
  }
}