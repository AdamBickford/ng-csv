import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest, concatMap, filter, from, map, of, single, skip, switchMap, take, tap, toArray } from 'rxjs';
import { validate } from 'class-validator';
import { Post, User } from './domain';
import { ParseSpan } from '@angular/compiler';
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
    body: Array<string>()
  })

  readonly validationResults$ = new BehaviorSubject<Array<{
    errorMessages: string[][],
    user: string
  }>>([])

  onFileSelect(event: any) {
    this.preview(event);
    this.validate(event);
  }

  private preview(event: any) {
    const tmp$ = new BehaviorSubject<ParseStepResult<unknown> | null>(null);
    Papa.parse<string[]>(event.target.files[0], {
      header: false,
      dynamicTyping: true,
      step: f => tmp$.next(f),
      complete: () => tmp$.complete()
    });

    tmp$.pipe(
      filter(Boolean),
      take(10),
      map(it => it.data),
      toArray(),
      map(it => ({
        headers: it[0] as string[],
        body: it.slice(1, it.length) as string[]
      })),
      tap(it => this.csvPreview$.next(it))
    ).subscribe();
  }

  private validate(event: any) {
    const tmp$ = new BehaviorSubject<ParseStepResult<unknown> | null>(null);
    Papa.parse<string[]>(event.target.files[0], {
      header: true,
      dynamicTyping: true,
      step: f => tmp$.next(f),
      complete: () => tmp$.complete()
    });

    tmp$.pipe(
      map(it => Object.assign(new User(), it?.data)),
      concatMap(it => from(validate(it))),
      map(error => {
        return {
          errorMessages: error.map(it => Object.values(it.constraints || {})),
          user: JSON.stringify(error[0]?.target ? error[0].target : 'No Errors')
        };
      }),
      toArray(),
      tap(it => this.validationResults$.next(it))
    )
      .subscribe(it => {
        console.log("results:", it);
      });
  }
}

