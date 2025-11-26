using { resurrection.db } from '../db/schema';

service SDService {
  entity VBAK as projection on db.VBAK;
  entity VBAP as projection on db.VBAP;
  entity KNA1 as projection on db.KNA1;
  entity KONV as projection on db.KONV;
}
