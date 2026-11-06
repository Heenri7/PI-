import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Adm {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  nome = '';
  email = '';
  senha = '';
  mensagem = '';
  mensagemSucesso = false;
  carregando = false;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  cadastrar(): void {
    this.mensagem = '';
    this.mensagemSucesso = false;

    const nome = this.nome.trim();
    const email = this.email.trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nome || /\d/.test(nome) || !emailValido || !this.senha) {
      this.mensagem = 'Informe um nome sem números, um e-mail válido e uma senha.';
      return;
    }

    this.carregando = true;
    this.http.get<Adm[]>('http://localhost:3000/adms').subscribe({
      next: (adms) => {
        if (adms.some((adm) => adm.email.toLowerCase() === email.toLowerCase())) {
          this.carregando = false;
          this.mensagem = 'Já existe uma conta cadastrada com esse e-mail.';
          return;
        }

        this.http.post<Adm>('http://localhost:3000/adms', {
          nome,
          email,
          senha: this.senha,
        }).subscribe({
          next: () => {
            this.carregando = false;
            sessionStorage.setItem('cadastroSucesso', 'Conta criada com sucesso. Faça login para acessar.');
            this.router.navigate(['/login']);
          },
          error: (erro: unknown) => {
            console.error('Não foi possível criar a conta:', erro);
            this.carregando = false;
            this.mensagem = 'Não foi possível criar a conta. Tente novamente.';
          },
        });
      },
      error: (erro: unknown) => {
        console.error('Não foi possível consultar as contas:', erro);
        this.carregando = false;
        this.mensagem = 'Não foi possível conectar ao servidor. Verifique se o json-server está iniciado.';
      },
    });
  }
}
