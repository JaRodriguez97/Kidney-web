import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlatformService } from './platform.service';

@Injectable({
	providedIn: 'root',
})
export class SidebarService {
	private readonly STORAGE_KEY = 'adminSidebarVisible';
	private readonly visibleSubject = new BehaviorSubject<boolean>(true);

	readonly visible$: Observable<boolean> = this.visibleSubject.asObservable();

	constructor(private platformService: PlatformService) {
		const stored = this.platformService.getLocalStorageItem(this.STORAGE_KEY);
		if (stored !== null) {
			this.visibleSubject.next(stored === 'true');
		}
	}

	toggle(): void {
		this.setVisible(!this.visibleSubject.value);
	}

	show(): void {
		this.setVisible(true);
	}

	hide(): void {
		this.setVisible(false);
	}

	private setVisible(value: boolean): void {
		this.visibleSubject.next(value);
		this.platformService.setLocalStorageItem(this.STORAGE_KEY, String(value));
	}
}
