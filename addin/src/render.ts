/** SVG -> PNG em base64 (sem prefixo data:), com resolução escala× a de exibição. */
export async function svgParaPng(svg: string, largura: number, altura: number, escala = 2): Promise<string> {
  const img = new Image();
  const carregada = new Promise<void>((ok, erro) => {
    img.onload = () => ok();
    img.onerror = () => erro(new Error("Falha ao rasterizar o SVG"));
  });
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await carregada;

  const canvas = document.createElement("canvas");
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png").split(",")[1];
}
