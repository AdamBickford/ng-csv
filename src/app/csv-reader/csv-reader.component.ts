import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, from, switchMap, take, tap, toArray } from 'rxjs';
import { makeTextFileLineIterator } from './parse'


@Component({
  selector: 'app-csv-reader',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './csv-reader.component.html',
  styleUrls: ['./csv-reader.component.css']
})
export class CsvReaderComponent /* implements AfterViewInit */ {
  //i don't love this but i can't find a way to work w/reactive forms
  //and get a reference to the actual file/blob vs just metadata about it
  //afaict it's either @ViewChild/AfterViewInit or calling an handler on dom event
  readonly csvData$ = new BehaviorSubject({
    headers: Array<string>(),
    body: Array<string>()
  })

  onFileSelect(event: any) {
    from(event.target.files as FileList)
      .pipe(
        switchMap(it => makeTextFileLineIterator(it.stream().getReader())),
        take(11),
        toArray(),
        tap(it => this.csvData$.next({
          headers: it.slice(0, 1),
          body: it.slice(1)
        })),
      )
      .subscribe()
  }
}
