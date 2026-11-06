import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Produto } from '../../models/produto';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class Produtos implements OnInit {
  produtos: Produto[] = [];
  mensagemErro = '';
  carregando = true;
  termoBusca = '';
  categoriaSelecionada = 'Todas';

  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  get categorias(): string[] {
    return ['Todas', ...new Set(this.produtos.map((produto) => produto.categoria))];
  }

  get produtosFiltrados(): Produto[] {
    const termo = this.termoBusca.trim().toLocaleLowerCase();

    return this.produtos.filter((produto) => {
      const correspondeCategoria = this.categoriaSelecionada === 'Todas'
        || produto.categoria === this.categoriaSelecionada;
      const correspondeNome = produto.nome.toLocaleLowerCase().includes(termo);

      return correspondeCategoria && correspondeNome;
    });
  }

  ngOnInit(): void {
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

  selecionarCategoria(categoria: string): void {
    this.categoriaSelecionada = categoria;
  }

  sair(): void {
    sessionStorage.removeItem('admLogado');
    this.router.navigate(['/login']);
  }
}
