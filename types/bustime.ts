export interface BusTimeError {
  msg: string;
  rtpidatafeed?: string;
  stpid?: string;
  rt?: string;
  vid?: string;
}

export type BusTimeEnvelope<T> = {
  "bustime-response": {
    error?: BusTimeError[];
  } & T;
};

export interface Route {
  rt: string;
  rtnm: string;
  rtclr: string;
  rtdd: string;
  rtpidatafeed?: string;
}

export interface Direction {
  id: string;
  name: string;
}

export interface Stop {
  stpid: string;
  stpnm: string;
  lat: number;
  lon: number;
  gtfsseq?: number;
  dtradd?: string[];
  dtrrem?: string[];
  ada?: boolean;
}

export interface PatternPoint {
  seq?: number;
  typ?: "S" | "W";
  stpid?: string;
  stpnm?: string;
  lat?: number;
  lon?: number;
}

export interface Pattern {
  pid: number;
  ln?: number;
  rtdir?: string;
  pt?: PatternPoint[];
}

export interface Prediction {
  tmstmp: string;
  typ: "A" | "D";
  stpid: string;
  stpnm: string;
  vid: string;
  dstp: number;
  rt: string;
  rtdd: string;
  rtdir: string;
  des: string;
  prdtm: string;
  dly: boolean;
  dyn?: number;
  tablockid: string;
  tatripid: string;
  origtatripno: string;
  prdctdn?: string;
  zone?: string;
  psgld?: "FULL" | "HALF_EMPTY" | "EMPTY" | "N/A";
  gtfsseq?: number;
  stst?: number;
  stsd?: string;
  flagstop?: -1 | 0 | 1 | 2;
}

export interface ServiceBulletin {
  nm?: string;
  sbj: string;
  dtl: string;
  brf?: string;
  prty?: string;
  mod?: string;
  srvc?: Array<{
    rt?: string;
    rtdir?: string;
    stpid?: string;
    stpnm?: string;
  }>;
}
