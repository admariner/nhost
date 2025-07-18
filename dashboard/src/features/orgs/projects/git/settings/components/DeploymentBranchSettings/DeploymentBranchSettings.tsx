import { useUI } from '@/components/common/UIProvider';
import { Form } from '@/components/form/Form';
import { SettingsContainer } from '@/components/layout/SettingsContainer';
import { Alert } from '@/components/ui/v2/Alert';
import { Input } from '@/components/ui/v2/Input';
import {
  GetOrganizationsDocument,
  useUpdateApplicationMutation,
} from '@/generated/graphql';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useProject } from '@/features/orgs/projects/hooks/useProject';
import { execPromiseWithErrorToast } from '@/features/orgs/utils/execPromiseWithErrorToast';
import { useUserData } from '@/hooks/useUserData';

export interface DeploymentBranchFormValues {
  /**
   * The git branch to deploy from.
   */
  repositoryProductionBranch: string;
}

export default function DeploymentBranchSettings() {
  const { maintenanceActive } = useUI();
  const { project } = useProject();
  const [updateApp] = useUpdateApplicationMutation();
  const userData = useUserData();

  const form = useForm<DeploymentBranchFormValues>({
    reValidateMode: 'onSubmit',
    defaultValues: {
      repositoryProductionBranch: project?.repositoryProductionBranch,
    },
  });

  const { register, reset, formState } = form;

  useEffect(() => {
    reset(() => ({
      repositoryProductionBranch: project?.repositoryProductionBranch,
    }));
  }, [project?.repositoryProductionBranch, reset]);

  const handleDeploymentBranchChange = async (
    values: DeploymentBranchFormValues,
  ) => {
    const updateAppMutation = updateApp({
      variables: {
        appId: project.id,
        app: {
          ...values,
        },
      },
      refetchQueries: [
        {
          query: GetOrganizationsDocument,
          variables: { userId: userData?.id },
        },
      ],
    });

    await execPromiseWithErrorToast(
      async () => {
        await updateAppMutation;
        form.reset(values);
      },
      {
        loadingMessage: 'The deployment branch is being updated...',
        successMessage: 'The deployment branch has been updated successfully.',
        errorMessage:
          'An error occurred while trying to create the permission variable.',
      },
    );
  };

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleDeploymentBranchChange}>
        <SettingsContainer
          title="Deployment Branch"
          description="All commits pushed to this deployment branch will trigger a deployment. You can switch to a different branch here."
          slotProps={{
            submitButton: {
              disabled: !formState.isDirty || maintenanceActive,
              loading: formState.isSubmitting,
            },
          }}
          docsLink="https://docs.nhost.io/platform/cloud/git#deployment-branch"
          className="grid grid-flow-row lg:grid-cols-5"
        >
          {project?.githubRepository ? (
            <Input
              {...register('repositoryProductionBranch')}
              name="repositoryProductionBranch"
              id="repositoryProductionBranch"
              className="col-span-2"
              fullWidth
              hideEmptyHelperText
            />
          ) : (
            <Alert className="col-span-5 w-full text-left">
              To change the Deployment Branch, you first need to connect your
              project to a GitHub repository.
            </Alert>
          )}
        </SettingsContainer>
      </Form>
    </FormProvider>
  );
}
