import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {SongsPageComponent} from './songs-page/songs-page.component';
import {GroupsPageComponent} from './groups-page/groups-page.component';
import {RouterModule, Routes} from '@angular/router';
import {AngularFireModule} from 'angularfire2';
import {environment} from '../environments/environment';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {FormsModule} from '@angular/forms';
import {SongPageComponent} from './song-page/song-page.component';
import {FetchSongDialogComponent} from './song-page/fetch-song-dialog/fetch-song-dialog.component';
import {ConfirmationDialogComponent} from './components/confirmation-dialog/confirmation-dialog.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AngularFireStorageModule} from 'angularfire2/storage';
import { RatingsPageComponent } from './ratings-page/ratings-page.component';

const appRoutes: Routes = [
    {path: 'songs-page', component: SongsPageComponent},
    {path: 'song-page/:key', component: SongPageComponent},
    {path: 'song-page', component: SongPageComponent},
    {path: 'groups-page', component: GroupsPageComponent},
    {path: 'ratings-page', component: RatingsPageComponent},
    {path: '**', redirectTo: 'songs-page'}
];

@NgModule({
    declarations: [
        AppComponent,
        SongsPageComponent,
        GroupsPageComponent,
        SongPageComponent,
        FetchSongDialogComponent,
        ConfirmationDialogComponent,
        ConfirmationDialogComponent,
        RatingsPageComponent
    ],
    imports: [
        RouterModule.forRoot(appRoutes),
        BrowserModule,
        AngularFireModule.initializeApp(environment.firebase, 'singalong'),
        AngularFireDatabaseModule,
        AngularFireStorageModule,
        FormsModule,
        NgbModule.forRoot()
    ],
    entryComponents: [
        ConfirmationDialogComponent,
        FetchSongDialogComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
