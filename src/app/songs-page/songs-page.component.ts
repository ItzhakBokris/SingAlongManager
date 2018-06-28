import {Component, OnInit} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {Song} from '../model';
import {snapshotToArray} from '../utils/firebase-utils';
import {environment} from '../../environments/environment';
import {DataSnapshot} from 'angularfire2/database/interfaces';
import {Router} from '@angular/router';

@Component({
    selector: 'app-songs-page',
    templateUrl: './songs-page.component.html',
    styleUrls: ['./songs-page.component.scss']
})
export class SongsPageComponent implements OnInit {

    public currentSongs: Song[];
    public currentPage = 0;
    public hasMoreSongs: boolean;
    public loading: boolean;
    public searchText: string;

    private nextStartAtSong: string;
    private previousEndAtSong: string;

    constructor(private database: AngularFireDatabase, private router: Router) {
    }

    public get previousSongsCount(): number {
        return this.currentPage * environment.pageSize;
    }

    public ngOnInit(): void {
        this.loadSongs();
    }

    public onSearchTextChange(): void {
        this.currentPage = 0;
        this.previousEndAtSong = null;
        this.nextStartAtSong = this.searchText;
        this.loadSongs();
    }

    public onChangePage(pageIndex: number): void {
        if (pageIndex > this.currentPage) {
            this.previousEndAtSong = null;
        } else {
            this.nextStartAtSong = null;
        }
        this.currentPage = pageIndex;
        this.loadSongs();
    }

    public onSongPress(song: Song): void {
        this.router.navigate(['song-page', song.key]).then();
    }

    public addSong(): void {
        this.router.navigate(['song-page']).then();
    }

    private loadSongs(): void {
        this.loading = true;
        let query = this.database.list('/songs').query.orderByChild('name');
        if (this.nextStartAtSong) {
            query = query.startAt(this.nextStartAtSong).limitToFirst(environment.pageSize + 1);
            if (this.searchText) {
                query = query.endAt(this.searchText + '\uf8ff');
            }
        } else if (this.previousEndAtSong) {
            query = query.endAt(this.previousEndAtSong).limitToLast(environment.pageSize + 1);
        } else {
            query = query.limitToFirst(environment.pageSize + 1);
        }
        query.once('value').then(this.onValueFetched.bind(this, this.searchText));
    }

    private onValueFetched(previousSearchText: string, snapshot: DataSnapshot): void {
        if (previousSearchText === this.searchText) {
            this.currentSongs = snapshotToArray(snapshot);
            if (this.currentSongs.length > 0) {
                this.previousEndAtSong = this.currentSongs[0].name;
                if (this.currentSongs.length > environment.pageSize) {
                    this.nextStartAtSong = this.currentSongs[environment.pageSize].name;
                    this.currentSongs = this.currentSongs.slice(0, environment.pageSize);
                    this.hasMoreSongs = true;
                } else {
                    this.hasMoreSongs = false;
                }
            }
            this.loading = false;
        }
    }
}
