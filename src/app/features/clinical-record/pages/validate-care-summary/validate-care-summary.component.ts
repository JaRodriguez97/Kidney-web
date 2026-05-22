import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ValidationResult {
	valid: boolean;
	message?: string;
	careId?: string | null;
	patientName?: string | null;
	attentionDate?: string | null;
	serviceName?: string | null;
	documentHash?: string | null;
	issuedAt?: string | null;
}

@Component({
	selector: 'app-validate-care-summary',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div class="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">
				<!-- Header -->
				<div class="flex items-center gap-3 mb-6 border-b border-gray-200 pb-5">
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center"
						[class]="
							loading
								? 'bg-gray-100'
								: result?.valid
									? 'bg-green-100'
									: 'bg-red-100'
						"
					>
						<svg
							*ngIf="loading"
							class="animate-spin w-5 h-5 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
						<svg
							*ngIf="!loading && result?.valid"
							class="w-5 h-5 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<svg
							*ngIf="!loading && result && !result.valid"
							class="w-5 h-5 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<div>
						<h1 class="text-lg font-bold text-gray-800">
							Validación de Documento
						</h1>
						<p class="text-sm text-gray-500">Resumen Digital de Atención</p>
					</div>
				</div>

				<!-- Loading -->
				<div *ngIf="loading" class="text-center py-8 text-gray-400">
					<p>Verificando autenticidad del documento...</p>
				</div>

				<!-- Error state -->
				<div
					*ngIf="!loading && result && !result.valid"
					class="text-center py-6"
				>
					<div
						class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-8 h-8 text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
							/>
						</svg>
					</div>
					<h2 class="text-xl font-bold text-red-700 mb-2">
						Documento no válido
					</h2>
					<p class="text-gray-500">
						{{
							result.message ??
								'El token de validación no corresponde a ningún documento registrado en el sistema.'
						}}
					</p>
				</div>

				<!-- Valid state -->
				<div *ngIf="!loading && result?.valid">
					<div
						class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6"
					>
						<svg
							class="w-5 h-5 text-green-600 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="text-green-800 font-semibold text-sm">
							Documento auténtico y verificado
						</p>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between border-b border-gray-100 pb-2">
							<span class="text-gray-500 font-medium">Paciente</span>
							<span class="text-gray-800 font-semibold">{{
								result?.patientName ?? '—'
							}}</span>
						</div>
						<div class="flex justify-between border-b border-gray-100 pb-2">
							<span class="text-gray-500 font-medium">Fecha de atención</span>
							<span class="text-gray-800 font-semibold">{{
								formatDate(result?.attentionDate)
							}}</span>
						</div>
						<div class="flex justify-between border-b border-gray-100 pb-2">
							<span class="text-gray-500 font-medium">Servicio</span>
							<span class="text-gray-800 font-semibold">{{
								result?.serviceName ?? '—'
							}}</span>
						</div>
						<div class="flex justify-between border-b border-gray-100 pb-2">
							<span class="text-gray-500 font-medium">Fecha emisión</span>
							<span class="text-gray-800 font-semibold">{{
								formatDate(result?.issuedAt)
							}}</span>
						</div>
					</div>

					<div
						*ngIf="result?.documentHash"
						class="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-3"
					>
						<p class="text-xs text-gray-400 mb-1 uppercase font-semibold">
							Código de autenticidad (SHA-256)
						</p>
						<p class="text-xs text-gray-600 font-mono break-all">
							{{ result?.documentHash }}
						</p>
					</div>
				</div>

				<!-- Footer -->
				<p class="text-center text-xs text-gray-400 mt-6">
					Verificación provista por <strong>Kinexa</strong> · Kidney Medicine
					SAS
				</p>
			</div>
		</div>
	`,
})
export class ValidateCareSummaryComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly http = inject(HttpClient);

	loading = true;
	result: ValidationResult | null = null;

	ngOnInit(): void {
		const token = this.route.snapshot.paramMap.get('token');
		if (!token) {
			this.loading = false;
			this.result = { valid: false, message: 'Token no proporcionado.' };
			return;
		}

		this.http
			.get<ValidationResult>(
				`${environment.apiUrl}/clinical-record/validate/${token}`,
			)
			.subscribe({
				next: (res) => {
					this.result = res;
					this.loading = false;
				},
				error: (err) => {
					this.result = {
						valid: false,
						message:
							err?.error?.message ?? 'No se pudo verificar el documento.',
					};
					this.loading = false;
				},
			});
	}

	formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '—';
		return new Intl.DateTimeFormat('es-CO', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			timeZone: 'America/Bogota',
		}).format(new Date(dateStr));
	}
}
