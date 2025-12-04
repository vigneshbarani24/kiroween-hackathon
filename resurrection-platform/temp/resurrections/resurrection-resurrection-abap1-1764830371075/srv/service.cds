using { resurrection.db } from '../db/schema';

service MMService {
  entity ekko as projection on db.ekko;
  entity ekpo as projection on db.ekpo;
}
