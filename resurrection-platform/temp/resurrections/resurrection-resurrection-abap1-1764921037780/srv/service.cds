using { resurrection.db as db } from '../db/schema';

service MMService {
  entity EKKO as projection on db.EKKO;
  entity EKPO as projection on db.EKPO;
}
