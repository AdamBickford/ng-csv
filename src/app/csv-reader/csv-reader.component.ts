import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, combineLatestAll, concatMap, filter, from, map, take, tap, toArray } from 'rxjs';
import { validate } from 'class-validator';
import { User } from './domain';
import * as Papa from 'papaparse';
import { ParseStepResult } from 'papaparse';

@Component({
  selector: 'app-csv-reader',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './csv-reader.component.html',
  styleUrls: ['./csv-reader.component.css']
})
export class CsvReaderComponent {
  //i don't love this but i can't find a way to work w/reactive forms
  //and get a reference to the actual file/blob vs just metadata about it
  //afaict it's either @ViewChild/AfterViewInit or calling an handler on dom event
  readonly csvPreview$ = new BehaviorSubject({
    headers: Array<string>(),
    body: Array<Array<string>>()
  })

  readonly validationResults$ = new BehaviorSubject<Array<{
    errorMessages: string[][],
    user: string
  }>>([])

  onFileSelect(event: any) {
    const tmp$ = new BehaviorSubject<ParseStepResult<unknown> | null>(null)

    .pipe(
      
    ) as BehaviorSubject<ParseStepResult<unknown> | null>

    Papa.parse<unknown>(event.target.files[0], {
      header: true,
      dynamicTyping: true,
      step: f => tmp$.next(f),
      complete: () => tmp$.complete()
    });

    const _preview$ = tmp$.pipe(
      filter(Boolean),
      take(10),
      toArray(),
      map(it => ({
        headers: (it as any)[0].meta.fields,
        body: it.map(row => Object.values(row.data as string[]))
      })),
      tap(it => this.csvPreview$.next(it))
    )

    const _validations$ = tmp$.pipe(
      map(it => Object.assign(new User(), it?.data)),
      concatMap(user => from(validate(user)).pipe(
        map(errors => ({ errors, user }))
      )),
      map(tuple => ({
        errorMessages: tuple.errors.map(it => Object.values(it.constraints || { _: "no errors yo" })),
        user: JSON.stringify(tuple.user)
      })),
      toArray(),
      tap(it => this.validationResults$.next(it))
    )

    combineLatest([_preview$, _validations$], (preview, validations) => {
      this.csvPreview$.next(preview)
      this.validationResults$.next(validations)
    })
    .subscribe()
  }
}

