import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartementDto } from './create-departement.dto';

// PartialType permet de rendre tous les champs de CreateDepartementDto optionnels
export class UpdateDepartementDto extends PartialType(CreateDepartementDto) {}
