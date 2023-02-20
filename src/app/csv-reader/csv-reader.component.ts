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
    const tmp$ = new BehaviorSubject<ParseStepResult<unknown> | null>(null)

    Papa.parse(event.target.files[0], {
      delimiter: "",
      header: true,
      dynamicTyping: true,
      step: f => tmp$.next(f),
      complete: () => tmp$.complete()
    })

    tmp$.pipe(
      filter(Boolean),
      map(it => Object.assign(new User(), it?.data)),
      concatMap(it => from(validate(it))),
      map(error => {
        return {
          errorMessages: error.map(it => Object.values(it.constraints || {})),
          user: JSON.stringify(error[0]!!.target)
        }
      }),
      toArray(),
      tap(it => this.validationResults$.next(it))
    )
      .subscribe(it => {
        console.log("results:", it);
      })

    /* from(event.target.files as FileList)
      .pipe(
        single(),
        switchMap(it => makeTextFileLineIterator(it.stream().getReader())),
        map(String),
        tap(it => console.log("Hmmm", it)),
        switchMap(it => combineLatest(
          // [from(it).pipe(take(1)),
          // from(it).pipe(skip(1))],
          [from(it).pipe(take(1), toArray()),
            from(it).pipe(skip(1), toArray())],
          (headers, body) => ({
            headers: headers,
            body: body
          })
        )),
      )
      .subscribe(it => {
        console.log("each row? ", it);
      })
 */


    /* let post = new Post();
    post.title = '< than 10'; // should not pass
    post.text = 'this is a great post about hell world'; // should not pass
    post.rating = 11; // should not pass

    from(validate(post))
      .pipe(
        switchMap(errors => from(errors)),
        tap(errors => console.log("errors ", errors)),
        map(error => Object.values(error.constraints || {})),
        toArray()
      )
      .subscribe(it => {
        console.log("final post answer", it);
      })


    let user = new User()
    user.userName = "anything"
    user.email = "lolnope@foo.jj"
    user.role = "user"

    from(validate(user))
      .pipe(
        switchMap(errors => from(errors)),
        tap(errors => console.log("errors ", errors)),
        map(error => Object.values(error.constraints || {})),
        toArray()
      )
      .subscribe(it => {
        console.log("final user", it);
      })
 */

    // from(event.target.files as FileList)
    //   .pipe(
    //     single(),
    //     switchMap(it => makeTextFileLineIterator(it.stream().getReader())),
    //     take(11),
    //     toArray(),
    //     tap(it => this.csvData$.next({
    //       headers: it.slice(0, 1),
    //       body: it.slice(1)
    //     })),
    //   )
    //   .subscribe()
  }
}

