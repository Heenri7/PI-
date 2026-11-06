import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Adm {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email = '';
  senha = '';
  mensagem = '';
  mensagemSucesso = false;
  carregando = false;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const cadastroSucesso = sessionStorage.getItem('cadastroSucesso');
    if (cadastroSucesso) {
      this.mensagem = cadastroSucesso;
      this.mensagemSucesso = true;
      sessionStorage.removeItem('cadastroSucesso');
    }
  }

  entrar(): void {
    this.mensagem = '';
    this.mensagemSucesso = false;
    this.carregando = true;

    this.http.get<Adm[]>('http://localhost:3000/adms').subscribe({
      next: (adms) => {
        const admEncontrado = adms.find((adm) =>
          adm.email.toLowerCase() === this.email.trim().toLowerCase()
          && adm.senha === this.senha
        );

        this.carregando = false;
        if (!admEncontrado) {
          this.mensagem = 'E-mail ou senha incorretos.';
          return;
        }

        sessionStorage.setItem('admLogado', 'true');
        this.router.navigate(['/produtos']);
      },
      error: (erro: unknown) => {
        console.error('Não foi possível consultar os administradores:', erro);
        this.carregando = false;
        this.mensagem = 'Não foi possível conectar ao servidor. Verifique se o json-server está iniciado.';
      },
    });
  }
}
