import {DataSnapshot} from 'angularfire2/database/interfaces';

export const snapshotToObject = <T>(snapshot: DataSnapshot): T => ({...snapshot.val(), key: snapshot.key});

export const snapshotToArray = (snapshot: DataSnapshot) => {
    const result = [];
    snapshot.forEach(childSnapshot => {
        result.push(snapshotToObject(childSnapshot));
    });
    return result;
};
