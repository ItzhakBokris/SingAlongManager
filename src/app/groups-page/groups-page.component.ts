import {Component, OnInit} from '@angular/core';
import {Group} from '../model';
import {AngularFireDatabase} from 'angularfire2/database';
import {snapshotToArray} from '../utils/firebase-utils';
import {environment} from '../../environments/environment';
import {DataSnapshot} from 'angularfire2/database/interfaces';

@Component({
    selector: 'app-groups-page',
    templateUrl: './groups-page.component.html',
    styleUrls: ['./groups-page.component.scss']
})
export class GroupsPageComponent implements OnInit {

    public currentGroups: Group[];
    public currentPage = 0;
    public hasMoreGroups: boolean;
    public loading: boolean;

    private nextStartAtGroup: string;
    private previousEndAtGroup: string;

    constructor(private database: AngularFireDatabase) {
    }

    public get previousGroupsCount(): number {
        return this.currentPage * environment.pageSize;
    }

    public ngOnInit(): void {
        this.loadGroups();
    }

    public onChangePage(pageIndex: number): void {
        if (pageIndex > this.currentPage) {
            this.previousEndAtGroup = null;
        } else {
            this.nextStartAtGroup = null;
        }
        this.currentPage = pageIndex;
        this.loadGroups();
    }

    public onGroupPress(group: Group): void {}

    private loadGroups(): void {
        this.loading = true;
        let query = this.database.list('/groups').query.orderByKey();
        if (this.nextStartAtGroup) {
            query = query.endAt(this.nextStartAtGroup).limitToLast(environment.pageSize + 1);
        } else if (this.previousEndAtGroup) {
            query = query.startAt(this.previousEndAtGroup).limitToFirst(environment.pageSize + 1);
        } else {
            query = query.limitToLast(environment.pageSize + 1);
        }
        query.once('value').then(this.onValueFetched.bind(this));
    }

    private onValueFetched(snapshot: DataSnapshot): void {
        this.currentGroups = snapshotToArray(snapshot).reverse();
        if (this.currentGroups.length > 0) {
            this.previousEndAtGroup = this.currentGroups[0].key;
            if (this.currentGroups.length > environment.pageSize) {
                this.nextStartAtGroup = this.currentGroups[environment.pageSize].key;
                this.currentGroups = this.currentGroups.slice(0, environment.pageSize);
                this.hasMoreGroups = true;
            } else {
                this.hasMoreGroups = false;
            }
        }
        this.loading = false;
    }
}
