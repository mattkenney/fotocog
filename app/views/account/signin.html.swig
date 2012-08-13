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
<form action="/account/signin" method="post">
<div class="row">
<div class="offset4 span4 well">
<h3>Sign in</h3>
<div class="space2"></div>
<label>E-mail address
<input class="span4" name="username" type="email" value="" />
</label>
<label>Password
<input class="span4" name="password" type="password" value="" />
</label>
<!--<label class="checkbox">
<input checked="checked" name="persist" type="checkbox" value="1" />
Stay signed in
</label>-->
<div class="space2"></div>
<input class="btn btn-primary" type="submit" value="Sign in" />
</div>
</div>
</form>
<div class="row">
<div class="offset4 span4 well">
<label>You can also sign in with Facebook.
<span class="space1"></span>
<a href="facebook" class="btn btn-primary">Facebook</a>
</label>
</div>
</div>
<div class="row">
<div class="offset4 span4 well">
<div class="row">
<div class="span2">
<label>Not a member yet?
<span class="space1"></span>
<a href="signup" class="btn btn-success">Sign up</a>
</label>
</div>
<div class="span2">
<!--<label>Need help signing in?
<span class="space1"></span>
<a href="help" class="btn btn-success">Help</a>
</label>-->
</div>
</div>
</div>
</div>
{%- endblock -%}

