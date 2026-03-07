import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '@app/features/auth/services/auth.service';
import { UserService } from '@app/core/services/user.service';
import { UserHeader } from '@app/domains/user/user-header.entity';

@Component({
  selector: 'app-top-admin',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './top-admin.component.html',
  styleUrl: './top-admin.component.scss',
})
export class TopAdminComponent implements OnInit {
  user: UserHeader | null = null;
  initials = '';
  photoUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    // Primero obtenemos el token y roles mínimos del AuthService (si necesitas roles para el header)
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.roles) {
        // Consultar datos completos al backend
        this.userService.getCurrentUser().subscribe((fullUser) => {
          this.user = {
            firstName: fullUser.firstName || '',
            lastName: fullUser.lastName || '',
            roles: fullUser.roles || user.roles || [],
          };
          this.initials = this.getInitials(
            this.user.firstName,
            this.user.lastName,
          );
          this.photoUrl = null; // No hay campo de foto en el modelo actual
        });
      } else {
        this.user = null;
        this.initials = '';
        this.photoUrl = null;
      }
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  }
}
