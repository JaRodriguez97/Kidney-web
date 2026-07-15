import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, PatientDocument } from '@app/core/services/patient.service';
import { ClinicalRecordService } from '@app/core/services/clinical-record.service';
import { LabsDashboardService } from '@app/core/services/labs-dashboard.service';
import { BlogService } from '@app/core/services/blog.service';
import { BillingService } from '@app/core/services/billing.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
	selector: 'app-documents-patient',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './documents-patient.component.html',
	styleUrl: './documents-patient.component.scss',
})
export class DocumentsPatientComponent implements OnInit {
	private readonly patientService = inject(PatientService);
	private readonly clinicalRecordService = inject(ClinicalRecordService);
	private readonly labsDashboardService = inject(LabsDashboardService);
	private readonly blogService = inject(BlogService);
	private readonly billingService = inject(BillingService);

	documents: PatientDocument[] = [];
	loading = false;
	errorMessage = '';
	downloadingId: string | null = null;

	// Filtros
	searchText = '';
	selectedCategory = 'ALL'; // 'ALL', 'MEDICAL', 'CERTIFICATES', 'INVOICES'
	selectedDate = '';

	// Paginación
	currentPage = 1;
	pageSize = 6;

	ngOnInit(): void {
		this.loadDocuments();
	}

	loadDocuments(): void {
		this.loading = true;
		this.errorMessage = '';
		this.patientService.getMyDocuments().subscribe({
			next: (docs) => {
				this.documents = docs;
				this.loading = false;
			},
			error: (err) => {
				console.error('Error loading patient documents', err);
				this.errorMessage = 'No se pudieron cargar tus documentos en este momento.';
				this.loading = false;
			},
		});
	}

	get filteredDocuments(): PatientDocument[] {
		return this.documents.filter((doc) => {
			// Filtro de Búsqueda
			if (this.searchText.trim()) {
				const term = this.searchText.toLowerCase();
				const matchTitle = doc.title.toLowerCase().includes(term);
				const matchIssuer = doc.issuer.toLowerCase().includes(term);
				const matchDetails = doc.details.toLowerCase().includes(term);
				if (!matchTitle && !matchIssuer && !matchDetails) {
					return false;
				}
			}

			// Filtro de Categoría
			if (this.selectedCategory !== 'ALL') {
				if (this.selectedCategory === 'MEDICAL') {
					if (doc.type !== 'INCAPACITY' && doc.type !== 'REFERRAL' && doc.type !== 'LAB') {
						return false;
					}
				} else if (this.selectedCategory === 'CERTIFICATES') {
					if (doc.type !== 'CERTIFICATE') {
						return false;
					}
				} else if (this.selectedCategory === 'INVOICES') {
					if (doc.type !== 'INVOICE') {
						return false;
					}
				}
			}

			// Filtro de Fecha
			if (this.selectedDate) {
				const docDate = doc.date.split('T')[0];
				if (docDate !== this.selectedDate) {
					return false;
				}
			}

			return true;
		});
	}

	get paginatedDocuments(): PatientDocument[] {
		const start = (this.currentPage - 1) * this.pageSize;
		return this.filteredDocuments.slice(start, start + this.pageSize);
	}

	get totalPages(): number {
		return Math.ceil(this.filteredDocuments.length / this.pageSize) || 1;
	}

	get pagesArray(): number[] {
		const arr: number[] = [];
		for (let i = 1; i <= this.totalPages; i++) {
			arr.push(i);
		}
		return arr;
	}

	changePage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
		}
	}

	applyFilters(): void {
		this.currentPage = 1;
	}

	formatDate(dateStr: string): string {
		return formatColombiaDate(dateStr);
	}

	viewDocument(doc: PatientDocument): void {
		this.downloadDocument(doc, true);
	}

	downloadDocument(doc: PatientDocument, viewMode = false): void {
		if (this.downloadingId) return;
		this.downloadingId = doc.id;

		if (doc.type === 'INCAPACITY' || doc.type === 'REFERRAL') {
			this.clinicalRecordService.downloadDigitalAttentionSummary(doc.downloadParam).subscribe({
				next: (blob) => {
					this.handleBlob(blob, `${doc.type.toLowerCase()}-${doc.id}.pdf`, viewMode);
					this.downloadingId = null;
				},
				error: (err) => {
					console.error('Error downloading clinical document', err);
					this.errorMessage = 'No se pudo descargar el documento clínico.';
					this.downloadingId = null;
				},
			});
		} else if (doc.type === 'LAB') {
			this.labsDashboardService.downloadResultPdf(doc.downloadParam).subscribe({
				next: (blob) => {
					this.handleBlob(blob, `resultado-laboratorio-${doc.id}.pdf`, viewMode);
					this.downloadingId = null;
				},
				error: (err) => {
					console.error('Error downloading lab PDF', err);
					this.errorMessage = 'No se pudo descargar el resultado de laboratorio.';
					this.downloadingId = null;
				},
			});
		} else if (doc.type === 'CERTIFICATE') {
			this.blogService.getCertificate(doc.downloadParam).subscribe({
				next: (certData) => {
					const printWindow = window.open('', '_blank');
					if (printWindow) {
						printWindow.document.write(certData.renderedHtml);
						printWindow.document.close();
						printWindow.focus();
						setTimeout(() => {
							printWindow.print();
						}, 500);
					}
					this.downloadingId = null;
				},
				error: (err) => {
					console.error('Error loading certificate', err);
					this.errorMessage = 'No se pudo obtener el certificado.';
					this.downloadingId = null;
				},
			});
		} else if (doc.type === 'INVOICE') {
			this.billingService.getInvoice(doc.downloadParam).subscribe({
				next: (invoice) => {
					const printWindow = window.open('', '_blank');
					if (printWindow) {
						const subtotal = invoice.subtotalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
						const total = invoice.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
						const paymentStatus = invoice.payment?.status === 'PAID' ? 'PAGADO' : 'PENDIENTE';

						const invoiceHtml = `
							<html>
								<head>
									<title>Factura ${invoice.invoiceNumber}</title>
									<style>
										body { font-family: sans-serif; padding: 40px; color: #333; }
										.header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
										.logo { font-size: 24px; font-weight: bold; color: #0284c7; }
										.invoice-info { text-align: right; }
										.details-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
										.details-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; font-weight: bold; }
										.details-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
										.totals { text-align: right; font-size: 16px; margin-top: 20px; }
										.totals div { margin-bottom: 8px; }
										.status-stamp { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 15px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
										.status-stamp.pending { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
									</style>
								</head>
								<body>
									<div class="header">
										<div class="logo">KINEXA MEDICINE</div>
										<div class="invoice-info">
											<h2 style="margin: 0; color: #1e293b;">Factura de Venta</h2>
											<div style="font-size: 14px; color: #64748b; margin-top: 5px;">No. ${invoice.invoiceNumber}</div>
										</div>
									</div>
									<div style="display: flex; justify-content: space-between; font-size: 14px;">
										<div>
											<strong>Emitido a:</strong><br>
											${invoice.patientName}<br>
											Paciente Kinexa
										</div>
										<div style="text-align: right;">
											<strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO')}<br>
											<strong>Estado:</strong> <span class="status-stamp ${paymentStatus === 'PENDIENTE' ? 'pending' : ''}">${paymentStatus}</span>
										</div>
									</div>
									<table class="details-table">
										<thead>
											<tr>
												<th>Descripción del Servicio</th>
												<th style="text-align: right;">Total</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>${invoice.serviceName}</td>
												<td style="text-align: right;">${total}</td>
											</tr>
										</tbody>
									</table>
									<div class="totals">
										<div>Subtotal: <strong>${subtotal}</strong></div>
										<div style="font-size: 18px; color: #0284c7; margin-top: 10px;">Total a Pagar: <strong>${total}</strong></div>
									</div>
									<div style="margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
										Gracias por confiar en Kinexa Medicine SAS.
									</div>
								</body>
							</html>
						`;
						printWindow.document.write(invoiceHtml);
						printWindow.document.close();
						printWindow.focus();
						setTimeout(() => {
							printWindow.print();
						}, 500);
					}
					this.downloadingId = null;
				},
				error: (err) => {
					console.error('Error loading invoice', err);
					this.errorMessage = 'No se pudo obtener el detalle de la factura.';
					this.downloadingId = null;
				},
			});
		}
	}

	private handleBlob(blob: Blob, fileName: string, viewMode: boolean): void {
		const objectUrl = window.URL.createObjectURL(blob);
		if (viewMode) {
			window.open(objectUrl, '_blank');
		} else {
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = fileName;
			link.click();
		}
		setTimeout(() => {
			window.URL.revokeObjectURL(objectUrl);
		}, 100);
	}
}
