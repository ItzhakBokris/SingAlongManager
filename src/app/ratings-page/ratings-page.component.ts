import {Component, OnInit} from '@angular/core';
import {Rating} from '../model';
import {AngularFireDatabase} from 'angularfire2/database';
import {snapshotToArray} from '../utils/firebase-utils';
import {environment} from '../../environments/environment';
import {DataSnapshot} from 'angularfire2/database/interfaces';

@Component({
    selector: 'app-ratings-page',
    templateUrl: './ratings-page.component.html',
    styleUrls: ['./ratings-page.component.scss']
})
export class RatingsPageComponent implements OnInit {

    public currentRatings: Rating[];
    public currentPage = 0;
    public hasMoreRatings: boolean;
    public loading: boolean;

    private nextStartAtRating: string;
    private previousEndAtRating: string;

    constructor(private database: AngularFireDatabase) {
    }

    public get previousRatingsCount(): number {
        return this.currentPage * environment.pageSize;
    }

    public ngOnInit(): void {
        this.loadRatings();
    }

    public onChangePage(pageIndex: number): void {
        if (pageIndex > this.currentPage) {
            this.previousEndAtRating = null;
        } else {
            this.nextStartAtRating = null;
        }
        this.currentPage = pageIndex;
        this.loadRatings();
    }

    public onRatingPress(rating: Rating): void {}

    private loadRatings(): void {
        this.loading = true;
        let query = this.database.list('/ratings').query.orderByKey();
        if (this.nextStartAtRating) {
            query = query.endAt(this.nextStartAtRating).limitToLast(environment.pageSize + 1);
        } else if (this.previousEndAtRating) {
            query = query.startAt(this.previousEndAtRating).limitToFirst(environment.pageSize + 1);
        } else {
            query = query.limitToLast(environment.pageSize + 1);
        }
        query.once('value').then(this.onValueFetched.bind(this));
    }

    private onValueFetched(snapshot: DataSnapshot): void {
        this.currentRatings = snapshotToArray(snapshot).reverse();
        if (this.currentRatings.length > 0) {
            this.previousEndAtRating = this.currentRatings[0].key;
            if (this.currentRatings.length > environment.pageSize) {
                this.nextStartAtRating = this.currentRatings[environment.pageSize].key;
                this.currentRatings = this.currentRatings.slice(0, environment.pageSize);
                this.hasMoreRatings = true;
            } else {
                this.hasMoreRatings = false;
            }
        }
        this.loading = false;
    }
}
