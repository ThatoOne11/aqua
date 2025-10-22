import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AlertConstants } from '@client-management/constants/alert.constants';

export class ClientManagementFormGroupBuilder {
  private conditionOptions = AlertConstants.CONDITION_OPTIONS;
  constructor(private formBuilder: FormBuilder) {}

  public buildAddClientForm(): FormGroup {
    return this.formBuilder.group({
      channel: ['', Validators.required],
      users: [[]],
    });
  }

  public buildAddUserForm(): FormGroup {
    return this.formBuilder.group({
      userId: [''],
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }
  public buildAddUsersToSiteForm(): FormGroup {
    return this.formBuilder.group({
      users: this.formBuilder.array([this.buildAddUserForm()]),
    });
  }

  public buildAddAlertForm(): FormGroup {
    return this.formBuilder.group({
      resultType: [null, Validators.required],
      condition: [
        null,
        [Validators.required, this.conditionValidator(this.conditionOptions)],
      ],
      value: ['', [Validators.pattern('^-?\\d+(\\.\\d+)?$')]],
    });
  }

  private conditionValidator(
    options: { value: string; viewValue: string }[]
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const isValid = options.some((option) => option.value === value);
      return isValid ? null : { invalidCondition: true };
    };
  }
}
