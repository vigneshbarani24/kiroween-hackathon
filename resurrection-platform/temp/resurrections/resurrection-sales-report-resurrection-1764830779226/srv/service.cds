using { resurrection.db } from '../db/schema';

service SDService {
  entity VBAK as projection on db.VBAK;
  entity VBAP as projection on db.VBAP;
}
