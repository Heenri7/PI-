import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DadosProduto, Produto } from '../../models/produto';

const novoProdutoVazio = (): DadosProduto => ({
  nome: '',
  preco: 0,
  quantidade: 0,
  categoria: '',
  imagem: '',
});

interface Categoria {
  id: string;
  nome: string;
}

const categoriasPadrao: Categoria[] = [
  { id: 'monitores', nome: 'Monitores' },
  { id: 'perifericos', nome: 'Periféricos' },
  { id: 'audio', nome: 'Áudio' },
  { id: 'smartphones', nome: 'Smartphones' },
  { id: 'notebooks', nome: 'Notebooks' },
];

@Component({
  selector: 'app-gerenciar-produtos',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './gerenciar-produtos.html',
  styleUrl: './gerenciar-produtos.css',
})
export class GerenciarProdutos implements OnInit {
  produtos: Produto[] = [];
  categorias = [...categoriasPadrao];
  formulario = novoProdutoVazio();
  produtoEmEdicao: string | null = null;
  novaCategoria = '';
  categoriaSelecionadaParaExcluir = '';
  mostrarNovaCategoria = false;
  mostrarExcluirCategoria = false;
  mensagem = '';
  mensagemErro = '';
  carregando = false;
  salvando = false;
  salvandoCategoria = false;

  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarCategorias();
  }

  carregarCategorias(): void {
    this.http.get<Categoria[]>('http://localhost:3000/categorias').subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.changeDetector.markForCheck();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível carregar as categorias:', erro);
        this.mensagemErro = 'Não foi possível carregar as categorias. Verifique se o json-server está iniciado.';
        this.categorias = [...categoriasPadrao];
        this.changeDetector.markForCheck();
      },
    });
  }

  carregarProdutos(): void {
    this.carregando = true;

    this.http.get<Produto[]>('http://localhost:3000/produtos').subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível carregar os produtos:', erro);
        this.mensagemErro = 'Não foi possível carregar os produtos. Verifique se o json-server está iniciado.';
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  salvar(): void {
    this.mensagem = '';
    this.mensagemErro = '';
    const nome = this.formulario.nome.trim();
    const categoriaValida = this.categorias.some(
      (categoria) => categoria.nome === this.formulario.categoria,
    );
    if (
      !nome
      || !categoriaValida
      || !Number.isFinite(this.formulario.preco)
      || this.formulario.preco < 0
      || !Number.isInteger(this.formulario.quantidade)
      || this.formulario.quantidade < 0
      || !this.formulario.imagem
    ) {
      this.mensagemErro = 'Preencha todos os campos corretamente. Preço e estoque não podem ser negativos.';
      return;
    }

    this.salvando = true;
    const estaEditando = this.produtoEmEdicao !== null;
    const dados: DadosProduto = {
      ...this.formulario,
      nome,
      categoria: this.formulario.categoria.trim(),
    };

    const requisicao = this.produtoEmEdicao
      ? this.http.put<Produto>(`http://localhost:3000/produtos/${this.produtoEmEdicao}`, dados)
      : this.http.post<Produto>('http://localhost:3000/produtos', dados);

    requisicao.subscribe({
      next: () => {
        this.cancelarEdicao();
        this.mensagem = estaEditando ? 'Produto atualizado.' : 'Produto cadastrado.';
        this.salvando = false;
        this.changeDetector.markForCheck();
        this.carregarProdutos();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível salvar o produto:', erro);
        this.mensagemErro = 'Não foi possível salvar o produto. Tente novamente.';
        this.salvando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  adicionarCategoria(): void {
    const nome = this.novaCategoria.trim();
    if (!nome) {
      return;
    }
    if (this.categorias.some((categoria) => categoria.nome.toLocaleLowerCase() === nome.toLocaleLowerCase())) {
      this.mensagemErro = 'Essa categoria já existe.';
      return;
    }

    this.mensagemErro = '';
    this.salvandoCategoria = true;
    const categoria: Categoria = { id: `categoria-${Date.now()}`, nome };
    this.http.post<Categoria>('http://localhost:3000/categorias', categoria).subscribe({
      next: (categoriaCriada) => {
        this.categorias = [...this.categorias, categoriaCriada];
        this.formulario.categoria = categoriaCriada.nome;
        this.novaCategoria = '';
        this.mostrarNovaCategoria = false;
        this.salvandoCategoria = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível adicionar a categoria:', erro);
        this.mensagemErro = 'Não foi possível adicionar a categoria. Tente novamente.';
        this.salvandoCategoria = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  excluirCategoria(): void {
    const categoria = this.categorias.find(
      (item) => item.id === this.categoriaSelecionadaParaExcluir,
    );
    if (!categoria) {
      return;
    }

    if (this.produtos.some((produto) => produto.categoria === categoria.nome)) {
      this.mensagemErro = `Não é possível excluir "${categoria.nome}" enquanto houver produtos nessa categoria.`;
      return;
    }
    if (!window.confirm(`Deseja excluir a categoria "${categoria.nome}"?`)) {
      return;
    }

    this.mensagemErro = '';
    this.mensagem = '';
    this.salvandoCategoria = true;
    this.http.delete<void>(`http://localhost:3000/categorias/${categoria.id}`).subscribe({
      next: () => {
        this.categorias = this.categorias.filter((item) => item.id !== categoria.id);
        if (this.formulario.categoria === categoria.nome) {
          this.formulario.categoria = '';
        }
        this.categoriaSelecionadaParaExcluir = '';
        this.mostrarExcluirCategoria = false;
        this.salvandoCategoria = false;
        this.mensagem = 'Categoria excluída.';
        this.changeDetector.markForCheck();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível excluir a categoria:', erro);
        this.mensagemErro = 'Não foi possível excluir a categoria. Tente novamente.';
        this.salvandoCategoria = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  editar(produto: Produto): void {
    this.produtoEmEdicao = produto.id;
    this.formulario = {
      nome: produto.nome,
      preco: produto.preco,
      quantidade: produto.quantidade,
      categoria: produto.categoria,
      imagem: produto.imagem,
    };
    this.mensagem = '';
    this.mensagemErro = '';
  }

  excluir(produto: Produto): void {
    if (!window.confirm(`Deseja excluir "${produto.nome}"?`)) {
      return;
    }

    this.mensagem = '';
    this.mensagemErro = '';
    this.http.delete<void>(`http://localhost:3000/produtos/${produto.id}`).subscribe({
      next: () => {
        this.mensagem = 'Produto excluído.';
        this.changeDetector.markForCheck();
        this.carregarProdutos();
      },
      error: (erro: unknown) => {
        console.error('Não foi possível excluir o produto:', erro);
        this.mensagemErro = 'Não foi possível excluir o produto. Tente novamente.';
        this.changeDetector.markForCheck();
      },
    });
  }

  cancelarEdicao(): void {
    this.produtoEmEdicao = null;
    this.formulario = novoProdutoVazio();
  }

  sair(): void {
    sessionStorage.removeItem('admLogado');
    this.router.navigate(['/login']);
  }
}
