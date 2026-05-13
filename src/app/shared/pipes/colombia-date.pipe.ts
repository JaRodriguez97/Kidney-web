import { Pipe, PipeTransform } from '@angular/core';
import {
	formatColombia,
	ColombiaDateFormat,
} from '@app/shared/utils/colombia-date.utils';

@Pipe({
	name: 'colombiaDate',
	standalone: true,
})
export class ColombiaDatePipe implements PipeTransform {
	transform(
		value: string | Date | null | undefined,
		format: ColombiaDateFormat = 'date',
	): string {
		if (!value) {
			return '-';
		}

		return formatColombia(value, format);
	}
}
