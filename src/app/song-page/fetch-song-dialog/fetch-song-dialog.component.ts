import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-fetch-song-dialog',
    templateUrl: './fetch-song-dialog.component.html',
    styleUrls: ['./fetch-song-dialog.component.scss']
})
export class FetchSongDialogComponent {

    public siteContent = '';
    public isInvalid: boolean;

    constructor(public activeModal: NgbActiveModal) {
    }

    public onSiteContentChange(): void {
        this.isInvalid = false;
    }

    public fetchSong(): void {
        const songProperties = this.fetchSongProperties();
        if (songProperties) {
            this.activeModal.close(songProperties);
        } else {
            this.isInvalid = true;
        }
    }

    public fetchSongProperties(): SongProperties {
        const dom = document.createElement('div');
        dom.innerHTML = this.siteContent.replace(/<(img|script) [^>]+>/gi, '');
        const songBlockTop = dom.getElementsByClassName('song_block_top')[0];
        if (!songBlockTop) {
            return;
        }
        const songHeader = songBlockTop.getElementsByClassName('blackNone')[0];
        if (!songHeader) {
            return;
        }
        const artist = songHeader.childNodes[0].textContent.trim();
        const name = songHeader.childNodes[1].textContent.replace(' - ', '').trim();
        if (!name || !artist) {
            return;
        }
        const song: SongProperties = {name, artist, lyrics: ''};
        const songContent = songBlockTop.getElementsByClassName('block_content_padd')[0];
        if (!songContent) {
            return;
        }
        let lyricsContent: HTMLDivElement;
        for (let index = 0; index < songContent.children.length; index++) {
            const currentContent = songContent.children[index];
            if (currentContent.nodeName.toLowerCase() === 'div' && (<HTMLDivElement>currentContent).align) {
                lyricsContent = <HTMLDivElement>currentContent;
                break;
            }
        }
        if (!lyricsContent) {
            return;
        }
        const chordsClass = lyricsContent.align === 'right' ? 'chords' : 'chords_en';
        const songTables = lyricsContent.getElementsByTagName('tbody');
        if (!songTables) {
            return;
        }
        for (let index = 0; index < songTables.length; index++) {
            const tableLines = songTables[index].getElementsByTagName('tr');
            if (!tableLines) {
                continue;
            }
            for (let lineIndex = 0; lineIndex < tableLines.length; lineIndex += 2) {
                const chordsPart: HTMLElement = <HTMLElement>tableLines[lineIndex].getElementsByClassName(chordsClass)[0];
                if (!chordsPart) {
                    const textPart = tableLines[lineIndex].getElementsByClassName('song')[0];
                    if (textPart) {
                        song.lyrics += '\n' + textPart.textContent.replace(/[\n\r]+/g, '').trim() + '\n';
                    }
                    lineIndex--;
                    continue;
                }
                let text = '';
                let lineIndexDecreased = false;
                if (tableLines.length <= lineIndex + 1) {
                    lineIndexDecreased = true;
                    lineIndex--;
                } else {
                    const nextLineTextPart = tableLines[lineIndex + 1].getElementsByClassName('song')[0];
                    if (nextLineTextPart) {
                        text += nextLineTextPart.textContent.replace(/[\n\r]+/g, '').trim();
                    } else {
                        lineIndexDecreased = true;
                        lineIndex--;
                    }
                }
                const divs = chordsPart.getElementsByTagName('div');
                for (let divIndex = divs.length; divIndex--;) {
                    chordsPart.removeChild(divs[divIndex]);
                }
                let chords = [];
                const chordElementList = chordsPart.getElementsByTagName('span');
                if (chordElementList.length > 0) {
                    for (let elementIndex = 0; elementIndex < chordElementList.length; elementIndex++) {
                        chords.push(chordElementList[elementIndex].textContent.replace(/[\s\n\r]+/g, '').trim());
                    }
                } else if (chordsPart.children.length === 0) {
                    chords = chordsPart.innerText.trim().split(/[  ]+/);
                }
                let spaces: RegExpExecArray | null;
                let chordIndex = 0;
                let chordTextPosition = 0;

                let chordsText = chordsPart.innerText.replace(/[\n\r]+/g, '')
                    .replace(/(([א-ת]+[  ])+[א-ת]+)/g, '');

                if (/[א-ת]/.test(text)) {
                    chordsText = chordsText.split('').reverse().join('');
                    const reversedChords = [];
                    for (let i = chords.length - 1; i >= 0; i--) {
                        reversedChords.push(chords[i]);
                    }
                    chords = reversedChords;
                }
                const spacesRegex = /[  ]+/g;
                while (chords.length > chordIndex && (spaces = spacesRegex.exec(chordsText))) {
                    let chord = chords[chordIndex];
                    if (chordIndex === 0 && spaces && spaces.index > 0) {
                        // The first chord is in the beginning of the line.
                        text = '[' + chord + ']' + text;
                        chordTextPosition += (2 + 2 * chord.length);
                        chordIndex++;
                        if (chords.length <= chordIndex) {
                            break;
                        }
                        chord = chords[chordIndex];
                    }
                    chordTextPosition += spaces[0].length;
                    const spaceChord = chordTextPosition >= text.length || /[^a-zא-ת]/i.test(text[chordTextPosition]);
                    text = text.slice(0, chordTextPosition) + (spaceChord ? ' ' : '') + '[' + chord + ']' + text.slice(chordTextPosition);
                    chordTextPosition += (2 + 2 * chord.length) + (spaceChord ? 1 : 0);
                    chordIndex++;
                }
                if (tableLines.length > 1 && lineIndex === 0 && !lineIndexDecreased) {
                    text = '\n' + text;
                }
                song.lyrics += text + '\n';
            }
        }
        song.lyrics = song.lyrics.trim();
        return song;
    }
}

export interface SongProperties {
    name: string;
    artist: string;
    lyrics: string;
}
