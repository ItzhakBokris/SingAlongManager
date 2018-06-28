import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {AngularFireDatabase} from 'angularfire2/database';
import {snapshotToArray, snapshotToObject} from '../utils/firebase-utils';
import {Artist, Lyrics, Song} from '../model';
import {FormControl, NgForm} from '@angular/forms';
import {ConfirmationDialogComponent} from '../components/confirmation-dialog/confirmation-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FetchSongDialogComponent, SongProperties} from './fetch-song-dialog/fetch-song-dialog.component';
import {AngularFireStorage, AngularFireUploadTask} from 'angularfire2/storage';

const GENERIC_ERROR_MESSAGE = 'Something went wrong, please try again later';
const ARTIST_IMAGE_MAP_KEY = 'artist_image_map_key';

@Component({
    selector: 'app-song-page',
    templateUrl: './song-page.component.html',
    styleUrls: ['./song-page.component.scss']
})
export class SongPageComponent implements OnInit, OnDestroy {

    public song: Song = {name: '', artist: ''};
    public lyrics: Lyrics = {text: ''};
    public artist: Artist = {name: '', images: []};
    public songKey: string;
    public isLoading: boolean;
    public isUpdating: boolean;
    public isUploading: boolean;
    public errorMessage: string;
    public successMessage: string;
    public isSubmitted: boolean;
    public uploadTask: AngularFireUploadTask;

    constructor(private database: AngularFireDatabase,
                private storage: AngularFireStorage,
                private activateRoute: ActivatedRoute,
                private router: Router,
                private modalService: NgbModal,
                private location: Location,
                private changeDetector: ChangeDetectorRef) {

        this.songKey = activateRoute.snapshot.params.key;
    }

    public get isNewSong(): boolean {
        return !this.songKey;
    }

    public get isArtistInvalid(): boolean {
        return !this.artist.name || !this.song.artist ||
            this.artist.name !== this.song.artist.trim().toLowerCase();
    }

    public get showUploadArtistImageButton(): boolean {
        return this.isArtistInvalid || this.artist.images.length < 5;
    }

    public ngOnInit(): void {
        if (this.songKey) {
            this.loadSong();
        }
    }

    public ngOnDestroy(): void {
        if (this.uploadTask) {
            this.uploadTask.cancel();
        }
    }

    public isRtl(text: string): boolean {
        return /[א-ת]/.test(text);
    }

    public toShowValid(control: FormControl): boolean {
        return control.valid && (control.dirty || control.touched);
    }

    public toShowInvalid(control: FormControl): boolean {
        return this.isSubmitted && control.invalid;
    }

    public save(form: NgForm): void {
        this.isSubmitted = true;
        if (form.valid) {
            if (this.isArtistInvalid) {
                this.loadOrCreateArtist(() => {
                    this.setImageFromArtistImages();
                    this.updateSong();
                });
            } else {
                this.updateSong();
            }
        }
    }

    public delete(): void {
        const modalRef = this.modalService.open(ConfirmationDialogComponent);
        modalRef.componentInstance.title = 'Delete Song';
        modalRef.componentInstance.content = 'Are you sure you want to delete the song?';
        modalRef.result.then(value => value &&
            this.handlePromises([
                this.database.object(`/songs/${this.songKey}`).remove(),
                this.database.object(`/lyricses/${this.song.lyrics}`).remove()
            ], () => this.location.back()));
    }

    public submit(form: NgForm): void {
        this.isSubmitted = true;
        if (form.valid) {
            if (this.isArtistInvalid) {
                this.loadOrCreateArtist(() => {
                    this.setImageFromArtistImages();
                    this.postSong();
                });
            } else {
                this.postSong();
            }
        }
    }

    public openFetchSongDialog(): void {
        const modalRef = this.modalService.open(FetchSongDialogComponent, {size: 'lg'});
        modalRef.result.then((result: SongProperties) => {
            if (result) {
                this.song = {...this.song, name: result.name, artist: result.artist};
                this.lyrics = {text: result.lyrics};
                this.loadOrCreateArtist(this.setImageFromArtistImages.bind(this));
            }
        });
    }

    public addImage(event: Event): void {
        this.isUploading = true;
        const ref = this.storage.ref(Math.random().toString(36).substring(2));
        this.uploadTask = ref.put((<HTMLInputElement>event.target).files[0]);
        this.uploadTask.then(() => ref.getDownloadURL().subscribe(url => {
            this.artist.images.push(url);
            this.database.object(`artists/${this.artist.key}`)
                .update({...this.artist, key: null}).then();
            this.song = {...this.song, image: url};
            this.isUploading = false;
        }));
    }

    public selectImage(image: string): void {
        this.song = {...this.song, image};
        const imageMap = JSON.parse(localStorage.getItem(ARTIST_IMAGE_MAP_KEY) || '{}');
        imageMap[this.artist.name] = image;
        localStorage.setItem(ARTIST_IMAGE_MAP_KEY, JSON.stringify(imageMap));
        this.changeDetector.detectChanges();
    }

    public onArtistChange(): void {
        if (this.isArtistInvalid) {
            this.song.image = null;
        } else {
            this.setImageFromArtistImages();
        }
    }

    private loadSong(): void {
        this.isLoading = true;
        this.database.object(`songs/${this.songKey}`)
            .snapshotChanges()
            .subscribe(action => {
                if (action.payload.exists()) {
                    this.song = snapshotToObject(action.payload);
                    this.loadLyrics();
                    this.loadOrCreateArtist();
                }
            });
    }

    private loadLyrics(): void {
        this.database.object(`lyricses/${this.song.lyrics}`)
            .snapshotChanges()
            .subscribe(action => {
                this.lyrics = snapshotToObject(action.payload);
                this.isLoading = false;
            });
    }

    private loadOrCreateArtist(onLoadArtist = () => null): void {
        const fixedArtistName = this.song.artist.trim().toLowerCase();
        this.database.list(`artists`).query
            .orderByChild('name')
            .equalTo(fixedArtistName)
            .on('value', snapshot => {
                const artists = snapshotToArray(snapshot);
                if (artists.length > 0) {
                    this.artist = artists[0];
                    this.artist.images = this.artist.images || [];
                    onLoadArtist();
                    this.changeDetector.detectChanges();
                } else {
                    this.artist = {name: fixedArtistName, images: []};
                    this.database.list(`artists`).push(this.artist).then();
                }
            });
    }

    private setImageFromArtistImages(): void {
        if (this.artist.images.length > 0 && !this.song.image) {
            const imageMap = JSON.parse(localStorage.getItem(ARTIST_IMAGE_MAP_KEY) || '{}');
            const image = imageMap[this.artist.name];
            if (image && this.artist.images.indexOf(image) >= 0) {
                this.song.image = image;
            } else {
                this.song.image = this.artist.images[0];
            }
        }
    }

    private postSong(): void {
        this.handlePromise(this.database.list('lyricses').push(this.lyrics),
            lyricsResult => {
                this.song = {
                    ...this.song,
                    lyrics: lyricsResult.key,
                    viewsCount: 0,
                    likesCount: 0,
                    creationDate: new Date().toISOString(),
                    lastModifiedDate: new Date().toISOString()
                };
                this.handlePromise(this.database.list('songs').push(this.song),
                    songResult => {
                        this.songKey = songResult.key;
                        this.song = {...this.song, key: this.songKey};
                        this.successMessage = 'Song Added!';
                    },
                    () => {
                        this.database.object(`lyricses/${lyricsResult.key}`).remove().then();
                    });
            });
    }

    private updateSong(): void {
        this.handlePromises([
            this.database.object(`/songs/${this.songKey}`).update({
                ...this.song,
                key: null,
                lastModifiedDate: new Date().toISOString()
            }),
            this.database.object(`/lyricses/${this.song.lyrics}`).update({...this.lyrics, key: null})
        ], () => this.successMessage = 'Changes Saved!');
    }

    private handlePromises(promises: (Promise<void> | PromiseLike<void>)[],
                           onSuccess = (results) => null,
                           onFailure = (errors) => null): void {
        this.successMessage = '';
        this.errorMessage = '';
        this.isUpdating = true;
        Promise.all(promises)
            .then((results) => {
                this.isUpdating = false;
                onSuccess(results);
                this.changeDetector.detectChanges();
            })
            .catch((errors) => {
                this.isUpdating = false;
                this.errorMessage = GENERIC_ERROR_MESSAGE;
                onFailure(errors);
                this.changeDetector.detectChanges();
            });
    }

    private handlePromise(promise: Promise<void> | PromiseLike<void>,
                          onSuccess = (result) => null,
                          onFailure = (error) => null): void {
        this.handlePromises(
            [promise],
            results => onSuccess(results[0]),
            errors => onFailure(errors[0])
        );
    }
}
