import { Driver } from './types.js'

const googleDriveDriver: Driver = {
    info1: "aaa",
    info2: "bbb",
    makeAuth: (arg0: string): boolean => {
        return true;
    },
    accessAPI: (arg0: string): string => {
        return "aaa"
    },
    particularInfoGD: "ok"
}

const amazonS3Driver: Driver = {
    info1: "aaa",
    info2: "bbb",
    makeAuth: (arg0: string): boolean => {
        return true;
    },
    accessAPI: (arg0: string): string => {
        return "aaa"
    },
    particularInfoS3: "ok"
}

const dropboxDriver: Driver = {
    info1: "aaa",
    info2: "bbb",
    makeAuth: (arg0: string): boolean => {
        return true;
    },
    accessAPI: (arg0: string): string => {
        return "aaa"
    },
    particularInfoDB: "ok"
}

const tenant2DriverMap =  new Map<string, Driver>([
    ["tenantA", googleDriveDriver],
    ["tenantB", amazonS3Driver],
    ["tenantC", dropboxDriver],
    ["tenantD", googleDriveDriver],
    ["tenantE", dropboxDriver],
    ["tenantF", amazonS3Driver],
    ["tenantG", dropboxDriver],
]);
