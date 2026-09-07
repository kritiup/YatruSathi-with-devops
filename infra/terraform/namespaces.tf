# The app namespaces, created here so the namespace-scoped GitHub deploy role
# never needs cluster-level namespace-create rights. The Kustomize base sets
# `namespace:` on every resource but no longer ships the Namespace object.

resource "kubernetes_namespace" "app" {
  for_each = toset([var.app_namespace, "${var.app_namespace}-staging"])

  metadata {
    name = each.value
    labels = {
      "app.kubernetes.io/part-of" = "yatrusathi"
    }
  }

  depends_on = [module.eks]
}
