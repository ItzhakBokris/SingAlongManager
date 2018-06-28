export const downloadFile = (fileContent: string, fileName: string): void => {
    const blob = new Blob([fileContent], {type: 'text/csv;charset=utf-8'});
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
    } else {
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
        }
    }
};

export const escapeCsvData = (fileContent: string): string => {
    return '"' + (fileContent || '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '""')
        .replace(/\x08/g, '\\b')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\f/g, '\\f')
        .replace(/\r/g, '\\r') + '"';
};
