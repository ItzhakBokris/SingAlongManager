export interface Song {
    key?: string;
    name: string;
    artist: string;
    viewsCount?: number;
    likesCount?: number;
    lyrics?: string;
    image?: string;
    creationDate?: string;
    lastModifiedDate?: string;
}

export interface Lyrics {
    key?: string;
    text: string;
}

export interface Artist {
    key?: string;
    name: string;
    images: string[];
}

export interface Group {
    key?: string;
    name: string;
    admin: string;
    pinCode: string;
    items: GroupSong[];
    members: string[];
}

export interface GroupSong {
    member: string;
    song: string;
}

export interface Rating {
    key: string;
    rating?: number;
    feedback?: string;
    nickname: string;
    creationDate: string;
    os: string;
    version: string;
}
