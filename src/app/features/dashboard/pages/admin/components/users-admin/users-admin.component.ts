import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	OrganizationUserRequest,
	UserService,
	CreateProviderRequest,
} from '@app/core/services/user.service';
import { ProviderTypeService } from '@app/core/services/provider-type.service';
import { User } from '@app/domains/user/user.entity';
import { ProviderType } from '@app/domains/user/provider-type.entity';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { RolAdminComponent } from './components/rol-admin/rol-admin.component';
import { RolOrganizationComponent } from './components/rol-organization/rol-organization.component';
import { RolPatientComponent } from './components/rol-patient/rol-patient.component';
import { SidebarService } from '@app/shared/services/sidebar.service';
import { RolProviderComponent } from './components/rol-provider/rol-provider.component';
import { CreateProviderTypeComponent } from './components/create-provider-type/create-provider-type.component';
import { OrganizationService } from '@app/core/services/organization.service';
import { RequestDetailsModalComponent } from './components/request-details-modal/request-details-modal.component';

@Component({
	selector: 'app-users-admin',
	standalone: true,
	imports: [
		CommonModule,
		InputTextComponent,
		FormsModule,
		RolAdminComponent,
		RolPatientComponent,
		RolOrganizationComponent,
		RolProviderComponent,
		CreateProviderTypeComponent,
		RequestDetailsModalComponent,
	],
	templateUrl: './users-admin.component.html',
	styleUrl: './users-admin.component.scss',
})
export class UsersAdminComponent implements OnInit {
	users: User[] = [];
	filteredUsers: User[] = [];
	showCreateModal = false;
	countAdmin = 0;
	countOrganization = 0;
	countPatient = 0;
	countProvider = 0;

	// Provider Types
	showProviderTypes = false;
	providerTypes: ProviderType[] = [];
	isLoadingProviderTypes = false;
	showCreateProviderTypeModal = false;

	// Filtros
	searchQuery = '';
	selectedRole = '';
	selectedStatus = '';

	// Modal - rol seleccionado al crear
	modalRole: 'paciente' | 'proveedor' | 'aliado' | 'admin' = 'paciente';

	// Estados
	isLoading = false;
	error: string | null = null;
	isCreatingUser = false;

	// ViewChild para acceder a los componentes hijos
	@ViewChild(RolPatientComponent) rolPatientComponent!: RolPatientComponent;
	@ViewChild(RolOrganizationComponent)
	rolOrganizationComponent!: RolOrganizationComponent;
	@ViewChild(RolAdminComponent) rolAdminComponent!: RolAdminComponent;
	@ViewChild(RolProviderComponent) rolProviderComponent!: RolProviderComponent;

	// Datos del formulario recopilados
	formData: any = {};

	// Modal - solicitud seleccionada al ver datos
	showRequestDetailsModal = false;
	selectedRequest: any = null;

	constructor(
		private userService: UserService,
		private sidebarService: SidebarService,
		private providerTypeService: ProviderTypeService,
		private organizationService: OrganizationService,
	) {}

	ngOnInit() {
		this.loadUsers();
	}

	loadUsers() {
		this.isLoading = true;
		this.error = null;

		this.userService.getUsers().subscribe({
			next: (users) => {
				this.users = users;
				this.applyFilters();
				this.countUsersType(users);
				this.isLoading = false;
			},
			error: (err) => {
				console.error('Error al traer usuarios:', err);
				this.error = 'Error al cargar usuarios. Intenta de nuevo.';
				this.isLoading = false;
			},
		});
	}

	countUsersType(users: User[]) {
		this.countAdmin = users.filter((u) => u.roles.includes('ADMIN')).length;
		this.countOrganization = users.filter((u) =>
			u.roles.includes('ORGANIZATION'),
		).length;
		this.countPatient = users.filter((u) => u.roles.includes('PATIENT')).length;
		this.countProvider = users.filter((u) =>
			u.roles.includes('PROVIDER'),
		).length;
	}

	applyFilters() {
		this.filteredUsers = this.users.filter((user) => {
			const matchesSearch =
				this.searchQuery === '' ||
				user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
				user.firstName
					?.toLowerCase()
					.includes(this.searchQuery.toLowerCase()) ||
				false ||
				user.lastName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
				false;

			const matchesRole =
				this.selectedRole === '' ||
				user.roles.join(',').includes(this.selectedRole);

			const matchesStatus =
				this.selectedStatus === '' ||
				(this.selectedStatus === 'pending' &&
					(user.status === 'SUBMITTED' ||
						user.status === 'UNDER_REVIEW' ||
						user.status === 'PENDING')) ||
				(this.selectedStatus === 'active' &&
					(user.status === 'ACTIVE' || user.status === 'active' || (user.status as any) === true)) ||
				(this.selectedStatus === 'inactive' &&
					(user.status === 'INACTIVE' || user.status === 'inactive' || !user.status || (user.status as any) === false));

			return matchesSearch && matchesRole && matchesStatus;
		});
	}

	onSearchChange() {
		this.applyFilters();
	}

	onRoleFilterChange() {
		this.applyFilters();
	}

	onStatusFilterChange() {
		this.applyFilters();
	}

	openCreateModal() {
		this.showCreateModal = true;
		this.sidebarService.hide(); // Ocultar sidebar al abrir el modal
	}

	closeCreateModal() {
		this.showCreateModal = false;
		this.formData = {};
		this.sidebarService.show(); // mostrar sidebar al cerrar el modal
	}

	createNewMember() {
		// Obtener datos del componente hijo correspondiente
		let userData: any = {};
		let isFormValid = true;

		if (this.modalRole === 'paciente') {
			if (
				!this.rolPatientComponent ||
				this.rolPatientComponent.patientForm.invalid
			) {
				isFormValid = false;
			} else {
				userData = {
					patient: {
						...this.rolPatientComponent.getFormData(),
						roleNames: ['PATIENT'],
					},
				};
			}
		} else if (this.modalRole === 'aliado') {
			if (
				!this.rolOrganizationComponent ||
				this.rolOrganizationComponent.organizationForm.invalid
			) {
				isFormValid = false;
			} else {
				userData = {
					organization: {
						...this.rolOrganizationComponent.getFormData(),
					},
				};
			}
		} else if (this.modalRole === 'admin') {
			if (!this.rolAdminComponent || this.rolAdminComponent.adminForm.invalid) {
				isFormValid = false;
			} else {
				userData = {
					admin: {
						...this.rolAdminComponent.getFormData(),
						roleNames: ['ADMIN'],
					},
				};
			}
		} else if (this.modalRole === 'proveedor') {
			if (
				!this.rolProviderComponent ||
				this.rolProviderComponent.providerForm.invalid ||
				!this.rolProviderComponent.isScheduleReady()
			) {
				isFormValid = false;
			} else {
				userData = {
					provider:
						this.rolProviderComponent.getFormData() as CreateProviderRequest,
				};
			}
		}

		if (!isFormValid) {
			alert('Por favor completa todos los campos obligatorios del formulario');
			return;
		}

		this.isCreatingUser = true;

		if (userData.provider) {
			this.userService.createProvider(userData.provider).subscribe({
				next: (response) => {
					console.log('Proveedor creado exitosamente:', response);
					this.isCreatingUser = false;
					this.loadUsers();
					this.closeCreateModal();
					alert('Proveedor de servicios creado exitosamente');
				},
				error: (error) => {
					console.error('Error al crear proveedor:', error);
					this.isCreatingUser = false;
					alert(
						'Error al crear proveedor: ' +
							(error.error?.message || 'Intenta de nuevo'),
					);
				},
			});
			return;
		}

		if (userData.organization) {
			this.userService.createOrganization(userData.organization).subscribe({
				next: (response) => {
					console.log('Organización creada exitosamente:', response);
					this.isCreatingUser = false;
					this.loadUsers(); // Recargar la lista de usuarios
					this.closeCreateModal(); // Cerrar modal y resetear datos
					alert('Organización creada exitosamente');
				},
				error: (error) => {
					console.error('Error al crear organización:', error);
					this.isCreatingUser = false;
					alert(
						'Error al crear organización: ' +
							(error.error?.message || 'Intenta de nuevo'),
					);
				},
			});

			return;
		}

		this.userService.createUser(userData).subscribe({
			next: (response) => {
				console.log('Usuario creado exitosamente:', response);
				this.isCreatingUser = false;
				this.sidebarService.show(); // mostrar sidebar al cerrar el modal
				this.loadUsers(); // Recargar la lista de usuarios
				this.closeCreateModal(); // Cerrar modal y resetear datos
				alert('Usuario creado exitosamente');
			},
			error: (error) => {
				console.error('Error al crear usuario:', error);
				this.isCreatingUser = false;
				this.sidebarService.hide(); // Ocultar sidebar al abrir el modal
				alert(
					'Error al crear usuario: ' +
						(error.error?.message || 'Intenta de nuevo'),
				);
			},
		});
	}

	getFullName(user: User): string {
		return (
			`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre'
		);
	}

	getInitials(user: User): string {
		const first = user.firstName?.charAt(0) || '';
		const last = user.lastName?.charAt(0) || '';
		return `${first}${last}`.toUpperCase();
	}

	userActivates(): number {
		return this.users.filter((u) => u.status == 'ACTIVE').length;
	}

	getStatusBadgeClass(user: any): string {
		if (user.status === 'ACTIVE' || user.status === 'active' || user.status === true) {
			return 'bg-green-50 text-green-700 border-green-100';
		} else if (
			user.status === 'SUBMITTED' ||
			user.status === 'UNDER_REVIEW' ||
			user.status === 'PENDING'
		) {
			return 'bg-amber-50 text-amber-700 border-amber-100';
		}
		return 'bg-red-50 text-red-700 border-red-100';
	}

	getStatusText(user: any): string {
		if (user.status === 'ACTIVE' || user.status === 'active' || user.status === true) {
			return 'Activo';
		} else if (
			user.status === 'SUBMITTED' ||
			user.status === 'UNDER_REVIEW' ||
			user.status === 'PENDING'
		) {
			return 'Pendiente';
		}
		return 'Inactivo';
	}

	getRoleBadgeClass(role: string): string {
		const roleMap: { [key: string]: string } = {
			ADMIN: 'bg-purple-50 text-purple-700 border-purple-100',
			PROVIDER: 'bg-blue-50 text-blue-700 border-blue-100',
			PATIENT: 'bg-green-50 text-green-700 border-green-100',
			ORGANIZATION: 'bg-amber-50 text-amber-700 border-amber-100',
		};
		return roleMap[role] || 'bg-gray-50 text-gray-700 border-gray-100';
	}

	getRoleLabel(role: string): string {
		const roleMap: { [key: string]: string } = {
			ADMIN: 'Administrador',
			PROVIDER: 'Proveedor',
			PATIENT: 'Paciente',
			ORGANIZATION: 'Aliado',
		};
		return roleMap[role] || role;
	}

	editUser(user: User) {
		console.log('Editar usuario:', user);
		// TODO: Implementar modal de edición
	}

	deleteUser(user: User) {
		if (
			confirm(
				`¿Estás seguro de que quieres eliminar a ${this.getFullName(user)}?`,
			)
		) {
			this.userService.deleteUser(user.id).subscribe({
				next: () => {
					this.loadUsers();
				},
				error: (err) => {
					console.error('Error al eliminar usuario:', err);
					alert('Error al eliminar usuario');
				},
			});
		}
	}

	// --- Provider Types ---

	toggleProviderTypes(): void {
		this.showProviderTypes = !this.showProviderTypes;
		if (this.showProviderTypes && this.providerTypes.length === 0) {
			this.loadProviderTypes();
		}
	}

	loadProviderTypes(): void {
		this.isLoadingProviderTypes = true;
		this.providerTypeService.getProviderTypes().subscribe({
			next: (types) => {
				this.providerTypes = types;
				this.isLoadingProviderTypes = false;
			},
			error: (err) => {
				console.error('Error al cargar tipos de proveedor:', err);
				this.isLoadingProviderTypes = false;
			},
		});
	}

	openCreateProviderTypeModal(): void {
		this.showCreateProviderTypeModal = true;
	}

	closeCreateProviderTypeModal(): void {
		this.showCreateProviderTypeModal = false;
	}

	onProviderTypeCreated(): void {
		this.loadProviderTypes();
	}

	// --- Request Actions ---

	viewRequestDetails(user: any) {
		this.selectedRequest = user;
		this.showRequestDetailsModal = true;
		this.sidebarService.hide();
	}

	closeRequestDetailsModal() {
		this.showRequestDetailsModal = false;
		this.selectedRequest = null;
		this.sidebarService.show();
	}

	approveRequest(user: any) {
		if (
			confirm(
				`¿Estás seguro de que quieres APROBAR la solicitud de ${user.firstName}?`,
			)
		) {
			this.isLoading = true;
			this.organizationService.approveAccessRequest(user.id).subscribe({
				next: (response) => {
					alert('Solicitud aprobada exitosamente. Se ha creado el aliado.');
					this.loadUsers();
				},
				error: (err) => {
					console.error('Error al aprobar solicitud:', err);
					alert(
						'Error al aprobar la solicitud: ' +
							(err.error?.message || err.message),
					);
					this.isLoading = false;
				},
			});
		}
	}

	rejectRequest(user: any) {
		const reason = prompt('Por favor, indica la razón del rechazo:');
		if (reason !== null) {
			this.isLoading = true;
			this.organizationService.rejectAccessRequest(user.id, reason).subscribe({
				next: (response) => {
					alert('Solicitud rechazada exitosamente.');
					this.loadUsers();
				},
				error: (err) => {
					console.error('Error al rechazar solicitud:', err);
					alert(
						'Error al rechazar la solicitud: ' +
							(err.error?.message || err.message),
					);
					this.isLoading = false;
				},
			});
		}
	}
}
