"""Gera os ícones PNG (quadrado azul do tema) usados pelo manifesto."""
import struct
import zlib
from pathlib import Path

DESTINO = Path(__file__).resolve().parent.parent / "addin" / "public"
AZUL = bytes([0x2F, 0x6F, 0xDC, 255])


def chunk(tipo: bytes, dados: bytes) -> bytes:
    corpo = tipo + dados
    return struct.pack(">I", len(dados)) + corpo + struct.pack(">I", zlib.crc32(corpo))


def png(n: int) -> bytes:
    linhas = b"".join(b"\x00" + AZUL * n for _ in range(n))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(linhas))
        + chunk(b"IEND", b"")
    )


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    for n in (16, 32, 64, 80):
        (DESTINO / f"icon-{n}.png").write_bytes(png(n))
