// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    firebase: {
        apiKey: 'AIzaSyB36Axani6trF_NlA7ZgJdZpky6DT7199c',
        authDomain: 'singalong-6aaf5.firebaseapp.com',
        databaseURL: 'https://singalong-6aaf5.firebaseio.com',
        projectId: 'singalong-6aaf5',
        storageBucket: 'gs://singalong-6aaf5.appspot.com',
        messagingSenderId: '1090194417681'
    },
    pageSize: 50,
    viewsCountMaxLength: 12
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
