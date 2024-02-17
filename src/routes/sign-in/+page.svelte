<script lang="ts">
  import * as Form from "$cui/form";
  import { sign_in, type sign_inSchema } from "$src/schema";
  import { Alert } from "$lib";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { FormOptions } from "formsnap";
  import { goto } from "$app/navigation";

  const options: FormOptions<typeof sign_in> = {
    validators: sign_in,
    onSubmit: () => {
      console.log("SUBMIT");
      submitting = true;
    },
    onResult(event) {
      if (event.result.type == "failure") {
        success = false;
      } else {
        success = true;
      }
      if (!success) {
        setTimeout(() => location.reload(), 1000);
      } else {
        setTimeout(() => goto("/"), 1000);
      }
    },
    warnings: {
      noValidationAndConstraints: false,
    },
  };

  export let form: SuperValidated<sign_inSchema>;
  let submitting = false;
  let success: boolean | null = null;
</script>

<Alert {submitting} {success} />
<div class="flex justify-center">
  <div class="w-4/5 max-w-lg">
    <Form.Root {options} method="POST" {form} schema={sign_in} let:config>
      <Form.Field {config} name="email_or_username">
        <Form.Item>
          <Form.Label>Email or Username</Form.Label>
          <Form.Input />
          <Form.Validation />
        </Form.Item>
      </Form.Field>
      <Form.Field {config} name="password">
        <Form.Item>
          <Form.Label>Password</Form.Label>
          <Form.Input />
          <Form.Validation />
        </Form.Item>
      </Form.Field>
      <Form.Button>Sign In</Form.Button>
    </Form.Root>
  </div>
</div>
