// Função para converter dataURL em blob de forma segura
export const dataURLToBlob = (dataURL: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    fetch(dataURL)
      .then((res) => res.blob())
      .then((blob) => resolve(blob))
      .catch(reject)
  })
}

/**
 * Converte um objeto File em uma string Base64.
 * Esta função é usada para armazenar imagens diretamente no banco de dados.
 * @param file O objeto File a ser convertido.
 * @returns Uma Promise que resolve com a string Base64 da imagem.
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = (error) => {
      console.error("❌ Erro ao ler arquivo para Base64:", error)
      reject(new Error("Falha ao converter arquivo para Base64."))
    }
    reader.readAsDataURL(file)
  })
}
