{%- extends 'base.html.swig' -%}
{#-
Copyright 2012 Matt Kenney

This file is part of Fotocog.

Fotocog is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

Fotocog is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License
along with Fotocog.  If not, see <http://www.gnu.org/licenses/>.
-#}
{%- block container -%}
<form action="/account/help" method="post">
<div class="row">
<div class="offset4 span4 well">
<h3>Sign in help</h3>
<p>Enter your e-mail address and we'll send you a link to reset your password.</p>
<div class="space1"></div>
<label>E-mail address
<input class="span4" name="username" type="email" value="" />
</label>
<div class="space2"></div>
<input class="btn btn-primary" type="submit" value="Send" />
</div>
</div>
</form>
<div class="row">
<div class="offset4 span4 well">
<div class="row">
<div class="span2">
<label>Not a member yet?
<div class="space1"></div>
<a href="signup" class="btn btn-success">Sign up</a>
</label>
</div>
<div class="span2">
<label>Already a member?
<div class="space1"></div>
<a href="signin" class="btn btn-success">Sign in</a>
</label>
</div>
</div>
</div>
</div>
{%- endblock -%}

