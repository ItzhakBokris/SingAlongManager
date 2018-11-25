import {Component} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {snapshotToArray} from './utils/firebase-utils';
import {Group, GroupSong, Rating, Song} from './model';
import {downloadFile, escapeCsvData} from './utils/files-utils';
import {environment} from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    public isCsvGenerated: boolean;
    public errorMessage: string;

    constructor(private database: AngularFireDatabase) {
    }

    public downloadData(): void {
        // this.database.list('songs').query.once('value', snapshot => {
        //     snapshotToArray(snapshot).forEach(song => {
        //         this.database.object(`/songs/${song.key}`).update({
        //             viewsCountName: `${('0'.repeat(environment.viewsCountMaxLength) +
        //                 song.viewsCount).slice(-environment.viewsCountMaxLength)}_${song.name}`,
        //         });
        //     });
        // }).then();
        // this.isCsvGenerated = true;
        if (!this.isCsvGenerated) {
            this.isCsvGenerated = true;
            Promise.all(
                [
                    this.database.list('songs').query.once('value'),
                    this.database.list('groups').query.once('value'),
                    this.database.list('ratings').query.once('value')
                ])
                .then(results => {
                    const songs = snapshotToArray(results[0]);
                    const groups = snapshotToArray(results[1]);
                    const ratings = snapshotToArray(results[2]);
                    downloadFile(this.generateSongsCsvFileContent(songs), 'songs.csv');
                    downloadFile(this.generateGroupsCsvFileContent(groups), 'groups.csv');
                    downloadFile(this.generateGroupsSongsCsvFileContent(groups), 'groups_songs.csv');
                    downloadFile(this.generateRatingsCsvFileContent(ratings), 'ratings.csv');
                    this.isCsvGenerated = false;
                })
                .catch(errors => {
                    console.error(errors);
                    this.errorMessage = 'Download failed, please try again later';
                    this.isCsvGenerated = false;
                    setTimeout(() => this.errorMessage = null, 5000);
                });
        }
    }

    private generateSongsCsvFileContent(songs: Song[]): string {
        let content =
            '#,' +
            'Key,' +
            'Song Name,' +
            'Artist,' +
            'Creation Date,' +
            'Last Modified Date,' +
            'Views Count\r\n';
        songs.forEach((song: Song, index: number) => {
            content +=
                (index + 1) + ',' +
                song.key + ',' +
                escapeCsvData(song.name) + ',' +
                escapeCsvData(song.artist) + ',' +
                (song.creationDate || '') + ',' +
                (song.lastModifiedDate || '') + ',' +
                song.viewsCount + '\r\n';
        });
        return content;
    }

    private generateGroupsCsvFileContent(groups: Group[]): string {
        let content =
            '#,' +
            'Key,' +
            'Group Name,' +
            'Admin,' +
            'Pin Code,' +
            'Songs Count,' +
            'Members Count\r\n';
        groups.forEach((group: Group, index: number) => {
            content +=
                (index + 1) + ',' +
                group.key + ',' +
                escapeCsvData(group.name) + ',' +
                escapeCsvData(group.admin) + ',' +
                group.pinCode + ',' +
                (group.items ? group.items.length : 0) + ',' +
                (group.members ? group.members.length : 0) + '\r\n';
        });
        return content;
    }

    private generateGroupsSongsCsvFileContent(groups: Group[]): string {
        let content = '#,Group,Song\r\n';
        let index = 0;
        groups.forEach((group: Group) => {
            group.items.forEach((item: GroupSong) => {
                content += `${++index},${group.key},${item.song}\r\n`;
            });
        });
        return content;
    }

    private generateRatingsCsvFileContent(ratings: Rating[]): string {
        let content =
            '#,' +
            'Rating,' +
            'Feedback,' +
            'Nickname,' +
            'Os,' +
            'App Version\r\n';
        ratings.forEach((rating: Rating, index: number) => {
            content +=
                (index + 1) + ',' +
                rating.rating + ',' +
                escapeCsvData(rating.feedback) + ',' +
                escapeCsvData(rating.nickname) + ',' +
                rating.os + ',' +
                rating.version + ',' +
                rating.creationDate + '\r\n';
        });
        return content;
    }
}
