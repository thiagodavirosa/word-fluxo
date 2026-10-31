export async function inserirOlaMundo(): Promise<void> {
  await Word.run(async (context) => {
    context.document
      .getSelection()
      .insertText("Olá, mundo (suplemento Fluxos)", Word.InsertLocation.replace);
    await context.sync();
  });
}
