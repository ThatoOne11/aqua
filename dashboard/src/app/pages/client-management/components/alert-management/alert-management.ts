import {
  Component,
  inject,
  Input,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AlertConstants } from '@client-management/constants/alert.constants';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { ResultType } from '@static/models/dto/result-type.model';
import { StaticService } from '@static/services/static.service';
import { ClientManagementFormGroupBuilder } from '@client-management/models/form-group/client-management-form-group-builder';
import { AlertForClient } from '@client-management/models/dtos/alert-for-client.model';
import { getAlertColDefs as GetAlertColDefs } from '@client-management/models/column-defintions/alert-colum-definition';
import { ClientAlert } from '@client-management/models/dtos/client-alert.model';
import { ColDef } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '@shared-components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-alert-management',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    AgGrid,
    MatAutocompleteModule,
  ],
  templateUrl: './alert-management.html',
  styleUrl: './alert-management.scss',
  standalone: true,
})
export class AlertManagement {
  @Input({ required: true }) alertsForClient: WritableSignal<AlertForClient[]> =
    signal([]);
  private dialog = inject(MatDialog);

  protected conditionOptions = AlertConstants.CONDITION_OPTIONS;

  protected alertFormGroup!: FormGroup;
  protected filteredResultTypes: ResultType[] = [];
  protected resultTypes: ResultType[] = [];
  protected selectedResultType?: ResultType;
  protected currentAlertColDefs!: ColDef[];

  constructor(
    private staticService: StaticService,
    private formBuilder: FormBuilder
  ) {
    this.setupAlertOptions();
    const clientManagementFormGroupBuilder =
      new ClientManagementFormGroupBuilder(this.formBuilder);
    this.alertFormGroup = clientManagementFormGroupBuilder.buildAddAlertForm();
    this.currentAlertColDefs = GetAlertColDefs(
      (clientAlertToDelete: ClientAlert) =>
        this.deleteAlert(clientAlertToDelete)
    );
  }

  protected async deleteAlert(alertToRemove: ClientAlert) {
    const shouldRemoveAlert = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Remove Alert',
            message: `Are you sure you want to remove alert '${alertToRemove.resultType.display_name} ${alertToRemove.condition} ${alertToRemove.value}'?`,
          },
        })
        .afterClosed()
    );
    if (!shouldRemoveAlert) return;
    this.alertsForClient.set(
      this.alertsForClient().filter(
        (alert) =>
          !(
            alert.resultType.id == alertToRemove.resultType.id &&
            alert.condition === alertToRemove.condition &&
            alert.value === alertToRemove.value
          )
      )
    );
  }

  protected onConditionSelected(value: string) {
    this.alertFormGroup.get('condition')?.setValue(value);
  }

  protected displayCondition = (value: string): string => {
    const match = this.conditionOptions.find((o) => o.value === value);
    return match ? match.viewValue : value;
  };

  protected getResultTypeDisplayName = (
    resultType: ResultType | null
  ): string => {
    return resultType ? resultType.display_name : '';
  };

  protected onResultTypeSelected(selectedId: string) {
    this.alertFormGroup.get('resultType')?.setValue(selectedId);
  }

  protected addAlert() {
    const { resultType, condition, value } = this.alertFormGroup.value;
    var newAlert = new AlertForClient('', resultType, condition, value);
    this.alertsForClient.set([...this.alertsForClient(), newAlert]);
    this.alertFormGroup.reset({
      resultType: null,
      condition: null,
      value: null,
    });
  }

  private setupAlertOptions() {
    this.staticService
      .GetResultTypes()
      .then((result) => {
        this.resultTypes = result;
        this.filteredResultTypes = result;

        this.alertFormGroup
          .get('resultType')!
          .valueChanges.subscribe((value) => {
            this.filteredResultTypes = this.filterResultTypes(value);
          });
      })
      .catch((error) => {
        console.error('Error loading result types:', error);
      });
  }

  private filterResultTypes(value: string): ResultType[] {
    const filterValue = value?.toLowerCase?.() ?? '';
    return this.resultTypes.filter((rt) =>
      rt.display_name.toLowerCase().includes(filterValue)
    );
  }
}
