import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsideAdminComponent } from '../components/aside-admin/aside-admin.component';
import { TopAdminComponent } from '../components/top-admin/top-admin.component';
import { AdminTourService } from '@app/core/services/tour/admin-tour.service';

@Component({
	selector: 'app-admin-dashboard',
	standalone: true,
	imports: [AsideAdminComponent, TopAdminComponent, RouterOutlet],
	templateUrl: './admin-dashboard.component.html',
	styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
	constructor(private adminTourService: AdminTourService) {}

	ngOnInit(): void {
		this.adminTourService.startIfFirstVisit();
	}

	onHelpClicked(): void {
		this.adminTourService.startTour();
	}
}
