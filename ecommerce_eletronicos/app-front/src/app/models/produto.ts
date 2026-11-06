export interface Produto {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria: string;
  imagem: string;
}

export type DadosProduto = Omit<Produto, 'id'>;
