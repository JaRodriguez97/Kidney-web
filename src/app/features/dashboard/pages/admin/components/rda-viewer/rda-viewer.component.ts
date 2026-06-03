import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	RdaDocumentResponse,
	RdaService,
} from '@app/core/services/rda.service';

@Component({
	selector: 'app-rda-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './rda-viewer.component.html',
	styleUrl: './rda-viewer.component.scss',
})
export class RdaViewerComponent {
	private readonly rdaService = inject(RdaService);

	careId = '';
	loading = false;
	transmitting = false;
	downloadingPreview = false;
	errorMessage = '';
	successMessage = '';
	document: RdaDocumentResponse | null = null;

	load(): void {
		if (!this.careId.trim()) return;

		this.loading = true;
		this.errorMessage = '';
		this.successMessage = '';

		this.rdaService.getByCareId(this.careId.trim()).subscribe({
			next: (doc) => {
				this.document = doc;
				this.loading = false;
			},
			error: () => {
				this.loading = false;
				this.document = null;
				this.errorMessage = 'No fue posible consultar el RDA para ese careId.';
			},
		});
	}

	retransmit(): void {
		if (!this.document || this.transmitting) return;

		this.transmitting = true;
		this.errorMessage = '';
		this.successMessage = '';

		this.rdaService.transmitByCareId(this.document.careId).subscribe({
			next: () => {
				this.transmitting = false;
				this.successMessage = 'RDA retransmitido exitosamente.';
			},
			error: () => {
				this.transmitting = false;
				this.errorMessage = 'No fue posible retransmitir el RDA.';
			},
		});
	}

	downloadPdf(): void {
		if (!this.document) return;

		this.rdaService.downloadPdfByCareId(this.document.careId).subscribe({
			next: (blob) => {
				const objectUrl = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = objectUrl;
				link.download = `rda-consulta-externa-${this.document?.careId}.pdf`;
				link.click();
				window.setTimeout(() => {
					window.URL.revokeObjectURL(objectUrl);
				}, 1500);
			},
			error: () => {
				this.errorMessage = 'No fue posible descargar el PDF del RDA.';
			},
		});
	}

	downloadMockPreview(): void {
		if (this.downloadingPreview) return;
		this.downloadingPreview = true;
		this.errorMessage = '';

		this.rdaService.downloadMockPreviewPdf().subscribe({
			next: (blob) => {
				this.downloadingPreview = false;
				const objectUrl = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = objectUrl;
				link.download = 'rda-consulta-externa-preview.pdf';
				link.click();
				window.setTimeout(() => {
					window.URL.revokeObjectURL(objectUrl);
				}, 1500);
			},
			error: () => {
				this.downloadingPreview = false;
				this.errorMessage =
					'No fue posible generar la plantilla PDF de preview.';
			},
		});
	}

	get sectionEntries(): Array<{ title: string; count: number }> {
		const sections = (
			(this.document?.fhirBundleJson?.['entry'] as Array<{
				resource?: Record<string, unknown>;
			}>) ?? []
		).find((entry) => entry.resource?.['resourceType'] === 'Composition')
			?.resource?.['section'] as Array<Record<string, unknown>> | undefined;

		if (!sections) return [];

		return sections.map((section) => {
			const entry =
				(section['entry'] as Array<Record<string, unknown>> | undefined) ?? [];
			return {
				title: String(section['title'] ?? 'Seccion'),
				count: entry.length,
			};
		});
	}

	get prettyBundle(): string {
		return JSON.stringify(this.document?.fhirBundleJson ?? {}, null, 2);
	}
}
