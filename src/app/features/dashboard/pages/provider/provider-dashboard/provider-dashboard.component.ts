import { Component } from '@angular/core';
import { AsideProviderComponent } from "../components/aside-provider/aside-provider.component";
import { TopProviderComponent } from "../components/top-provider/top-provider.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [AsideProviderComponent, TopProviderComponent, RouterModule],
  templateUrl: './provider-dashboard.component.html',
  styleUrl: './provider-dashboard.component.scss'
})
export class ProviderDashboardComponent {

}
